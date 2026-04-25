---
read_when:
    - إضافة أتمتة متصفح يتحكم فيها الوكيل
    - تصحيح سبب تداخل openclaw مع Chrome الخاص بك
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة تحكم متكاملة في المتصفح + أوامر الإجراءات
title: المتصفح (بإدارة OpenClaw)
x-i18n:
    generated_at: "2026-04-25T13:59:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f6915568d2119d2473fc4ee489a03582ffd34218125835d5e073476d3009896
    source_path: tools/browser.md
    workflow: 15
---

يمكن لـ OpenClaw تشغيل **ملف تعريف مخصص لـ Chrome/Brave/Edge/Chromium** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي وتتم إدارته عبر خدمة تحكم محلية صغيرة
داخل Gateway (local loopback فقط).

منظور للمبتدئين:

- فكّر فيه على أنه **متصفح منفصل مخصص للوكيل فقط**.
- ملف التعريف `openclaw` لا يعبث بملف تعريف متصفحك الشخصي.
- يمكن للوكيل **فتح علامات تبويب وقراءة الصفحات والنقر والكتابة** ضمن مسار آمن.
- يتصل ملف التعريف `user` المضمّن بجلسة Chrome الحقيقية المسجّل دخولك فيها عبر Chrome MCP.

## ما الذي تحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** (بلون برتقالي افتراضيًا).
- تحكم حتمي في علامات التبويب (سرد/فتح/تركيز/إغلاق).
- إجراءات الوكيل (نقر/كتابة/سحب/تحديد) ولقطات وصور شاشة وملفات PDF.
- Skill مضمّنة باسم `browser-automation` تعلّم الوكلاء
  حلقة الاسترداد الخاصة باللقطات وstable-tab وstale-ref وmanual-blocker
  عند تمكين Plugin المتصفح.
- دعم اختياري لعدة ملفات تعريف (`openclaw` و`work` و`remote` و...).

هذا المتصفح **ليس** متصفحك اليومي. إنه سطح آمن ومعزول
لأتمتة الوكيل والتحقق.

## بداية سريعة

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

إذا ظهرت لك رسالة “Browser disabled”، فقم بتمكينه في الإعدادات (انظر أدناه) ثم أعد تشغيل
Gateway.

إذا كان `openclaw browser` مفقودًا بالكامل، أو قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر أو أداة المتصفح المفقودة](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم في Plugin

أداة `browser` الافتراضية هي Plugin مضمّنة. عطّلها لاستبدالها بـ Plugin أخرى تسجّل اسم أداة `browser` نفسه:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

تتطلب الإعدادات الافتراضية كلًا من `plugins.entries.browser.enabled` و`browser.enabled=true`. تعطيل Plugin فقط يزيل CLI `openclaw browser`، وطريقة Gateway المسماة `browser.request`، وأداة الوكيل، وخدمة التحكم كوحدة واحدة؛ بينما تبقى إعدادات `browser.*` لديك كما هي من أجل البديل.

تتطلب تغييرات إعدادات المتصفح إعادة تشغيل Gateway حتى تتمكن Plugin من إعادة تسجيل خدمتها.

## إرشادات الوكيل

تتضمن Plugin المتصفح مستويين من إرشادات الوكيل:

- يحمل وصف أداة `browser` العقد الموجز الدائم التشغيل: اختر
  ملف التعريف الصحيح، واحتفظ بالمراجع في علامة التبويب نفسها، واستخدم `tabId`/التسميات لاستهداف علامات التبويب، وحمّل Skill المتصفح للأعمال متعددة الخطوات.
- تحمل Skill المضمّنة `browser-automation` حلقة التشغيل الأطول:
  تحقق من الحالة/علامات التبويب أولًا، وسمِّ علامات تبويب المهمة، والتقط snapshot قبل الإجراء، وأعد الالتقاط
  بعد تغييرات واجهة المستخدم، واستعد مراجع stale مرة واحدة، وأبلغ عن
  عوائق تسجيل الدخول/2FA/captcha أو الكاميرا/الميكروفون كإجراء يدوي بدلًا من التخمين.

تُدرج Skills المضمّنة في Plugin ضمن Skills المتاحة للوكيل عندما تكون
Plugin مفعّلة. وتُحمّل تعليمات Skill الكاملة عند الطلب، لذلك لا تتحمل
الدورات الروتينية التكلفة الكاملة للرموز.

## أمر أو أداة المتصفح المفقودة

إذا أصبح `openclaw browser` غير معروف بعد الترقية، أو كانت `browser.request` مفقودة، أو أبلغ الوكيل بأن أداة المتصفح غير متاحة، فالسبب المعتاد هو وجود قائمة `plugins.allow` لا تتضمن `browser`. أضِفه:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

لا تُعدّ `browser.enabled=true` و`plugins.entries.browser.enabled=true` و`tools.alsoAllow: ["browser"]` بدائل لعضوية قائمة السماح — إذ تتحكم قائمة السماح في تحميل Plugin، ولا تُطبّق سياسة الأداة إلا بعد التحميل. كما أن إزالة `plugins.allow` بالكامل تعيد أيضًا السلوك الافتراضي.

## ملفات التعريف: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (لا يتطلب إضافة).
- `user`: ملف تعريف إرفاق Chrome MCP مضمّن لجلسة **Chrome الحقيقية المسجّل دخولك فيها**.

بالنسبة إلى استدعاءات أداة المتصفح الخاصة بالوكيل:

- الافتراضي: استخدم متصفح `openclaw` المعزول.
- فضّل `profile="user"` عندما تكون الجلسات الحالية المسجّل دخولها مهمة ويكون المستخدم
  موجودًا عند الجهاز للنقر/الموافقة على أي مطالبة إرفاق.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددًا.

اضبط `browser.defaultProfile: "openclaw"` إذا أردت الوضع المُدار افتراضيًا.

## الإعدادات

توجد إعدادات المتصفح في `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // الافتراضي: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // فعّله فقط عند الثقة المقصودة بإمكانية الوصول إلى الشبكة الخاصة
      // allowPrivateNetwork: true, // اسم بديل قديم
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // تجاوز قديم لملف تعريف واحد
    remoteCdpTimeoutMs: 1500, // مهلة HTTP لـ CDP البعيد (بالملي ثانية)
    remoteCdpHandshakeTimeoutMs: 3000, // مهلة مصافحة WebSocket لـ CDP البعيد (بالملي ثانية)
    localLaunchTimeoutMs: 15000, // مهلة اكتشاف Chrome المُدار المحلي (بالملي ثانية)
    localCdpReadyTimeoutMs: 8000, // مهلة جاهزية CDP المحلي بعد التشغيل (بالملي ثانية)
    actionTimeoutMs: 60000, // مهلة act الافتراضية للمتصفح (بالملي ثانية)
    tabCleanup: {
      enabled: true, // الافتراضي: true
      idleMinutes: 120, // اضبطه على 0 لتعطيل تنظيف الخمول
      maxTabsPerSession: 8, // اضبطه على 0 لتعطيل الحد الأقصى لكل جلسة
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="المنافذ وقابلية الوصول">

- ترتبط خدمة التحكم بـ local loopback على منفذ مشتق من `gateway.port` (الافتراضي `18791` = gateway + 2). يؤدي تجاوز `gateway.port` أو `OPENCLAW_GATEWAY_PORT` إلى إزاحة المنافذ المشتقة ضمن العائلة نفسها.
- تعيّن ملفات تعريف `openclaw` المحلية `cdpPort`/`cdpUrl` تلقائيًا؛ اضبط هذه القيم فقط لـ CDP البعيد. ويكون `cdpUrl` افتراضيًا إلى منفذ CDP المحلي المُدار عند عدم ضبطه.
- ينطبق `remoteCdpTimeoutMs` على فحوصات قابلية الوصول HTTP لـ CDP البعيد (غير loopback)؛ وينطبق `remoteCdpHandshakeTimeoutMs` على مصافحات WebSocket لـ CDP البعيد.
- تمثل `localLaunchTimeoutMs` الميزانية الزمنية اللازمة كي تعرّض عملية Chrome
  المحلية المُدارة والمشغلة محليًا نقطة نهاية CDP HTTP الخاصة بها. وتمثل `localCdpReadyTimeoutMs`
  الميزانية اللاحقة اللازمة لجاهزية websocket الخاصة بـ CDP بعد اكتشاف العملية.
  زد هذه القيم على Raspberry Pi، أو VPS منخفض المواصفات، أو الأجهزة الأقدم التي يبدأ فيها Chromium
  ببطء. تُقيَّد القيم بحد أقصى قدره 120000 ms.
- تمثل `actionTimeoutMs` الميزانية الافتراضية لطلبات `act` في المتصفح عندما لا يمرر المستدعي `timeoutMs`. تضيف وسيلة نقل العميل هامشًا زمنيًا صغيرًا بحيث يمكن للانتظارات الطويلة أن تنتهي بدلًا من انقضاء المهلة عند حد HTTP.
- يمثل `tabCleanup` تنظيفًا بأفضل جهد لعلامات التبويب التي تفتحها جلسات المتصفح الخاصة بالوكيل الأساسي. لا يزال تنظيف دورة الحياة في subagent وCron وACP يغلق علامات التبويب الصريحة المتعقبة الخاصة بها عند نهاية الجلسة؛ بينما تبقي الجلسات الأساسية علامات التبويب النشطة قابلة لإعادة الاستخدام، ثم تغلق علامات التبويب المتعقبة الخاملة أو الزائدة في الخلفية.

</Accordion>

<Accordion title="سياسة SSRF">

- تتم حماية تنقل المتصفح وفتح علامات التبويب من SSRF قبل التنقل، ويُعاد التحقق منها بأفضل جهد على عنوان URL النهائي من نوع `http(s)` بعد ذلك.
- في وضع SSRF الصارم، يتم أيضًا التحقق من اكتشاف نقطة نهاية CDP البعيدة واستقصاءات `/json/version` (`cdpUrl`).
- لا تقوم متغيرات البيئة `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` و`NO_PROXY` الخاصة بـ Gateway/المزوّد تلقائيًا بتمرير متصفح OpenClaw المُدار عبر وكيل. فعمليات تشغيل Chrome المُدار تتصل مباشرة افتراضيًا حتى لا تُضعف إعدادات وكيل المزوّد فحوصات SSRF الخاصة بالمتصفح.
- لتمرير المتصفح المُدار نفسه عبر وكيل، مرّر أعلام وكيل Chrome صريحة عبر `browser.extraArgs`، مثل `--proxy-server=...` أو `--proxy-pac-url=...`. يمنع وضع SSRF الصارم التوجيه الصريح لوكيل المتصفح ما لم يتم تفعيل الوصول إلى متصفح الشبكة الخاصة عمدًا.
- تكون `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلة افتراضيًا؛ فعّلها فقط عندما تكون الثقة المقصودة في الوصول إلى متصفح الشبكة الخاصة موجودة.
- لا يزال `browser.ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم بديل قديم.

</Accordion>

<Accordion title="سلوك ملفات التعريف">

- تعني `attachOnly: true` عدم تشغيل متصفح محلي أبدًا؛ بل الإرفاق فقط إذا كان يعمل بالفعل.
- يمكن ضبط `headless` على المستوى العام أو لكل ملف تعريف محلي مُدار. وتتجاوز القيم الخاصة بكل ملف تعريف قيمة `browser.headless`، بحيث يمكن أن يبقى ملف تعريف مُشغَّل محليًا بلا واجهة بينما يظل آخر مرئيًا.
- يطلب `POST /start?headless=true` و`openclaw browser start --headless`
  تشغيلًا بلا واجهة لمرة واحدة لملفات التعريف المحلية المُدارة من دون إعادة كتابة
  `browser.headless` أو إعدادات ملف التعريف. وترفض ملفات التعريف existing-session وattach-only وCDP البعيدة هذا التجاوز لأن OpenClaw لا يشغّل عمليات
  المتصفح هذه.
- على مضيفات Linux التي لا تحتوي على `DISPLAY` أو `WAYLAND_DISPLAY`، تُفعَّل ملفات التعريف المحلية المُدارة
  بوضع بلا واجهة افتراضيًا تلقائيًا عندما لا تختار البيئة ولا
  إعدادات الملف/الإعدادات العامة الوضع المرئي صراحةً. ويعرض `openclaw browser status --json`
  قيمة `headlessSource` على أنها `env` أو `profile` أو `config` أو
  `request` أو `linux-display-fallback` أو `default`.
- يفرض `OPENCLAW_BROWSER_HEADLESS=1` التشغيل المحلي المُدار بلا واجهة على
  العملية الحالية. ويفرض `OPENCLAW_BROWSER_HEADLESS=0` الوضع المرئي لعمليات
  التشغيل العادية ويعيد خطأً قابلًا للتنفيذ على مضيفات Linux من دون خادم عرض؛
  ويظل الطلب الصريح `start --headless` هو الفائز لتلك العملية الواحدة.
- يمكن ضبط `executablePath` على المستوى العام أو لكل ملف تعريف محلي مُدار. وتتجاوز القيم الخاصة بكل ملف تعريف قيمة `browser.executablePath`، بحيث يمكن لملفات التعريف المُدارة المختلفة تشغيل متصفحات مختلفة مبنية على Chromium.
- تقوم `color` (على المستوى الأعلى ولكل ملف تعريف) بتلوين واجهة المتصفح بحيث يمكنك معرفة أي ملف تعريف نشط.
- ملف التعريف الافتراضي هو `openclaw` (مُدار مستقل). استخدم `defaultProfile: "user"` للاختيار المقصود لمتصفح المستخدم المسجل دخوله.
- ترتيب الاكتشاف التلقائي: متصفح النظام الافتراضي إذا كان مبنيًا على Chromium؛ وإلا Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- يستخدم `driver: "existing-session"` ‏Chrome DevTools MCP بدلًا من CDP الخام. لا تضبط `cdpUrl` لهذا المشغّل.
- اضبط `browser.profiles.<name>.userDataDir` عندما يجب أن يرفق ملف تعريف existing-session بملف تعريف مستخدم Chromium غير افتراضي (Brave أو Edge أو غيرهما).

</Accordion>

</AccordionGroup>

## استخدم Brave (أو متصفحًا آخر مبنيًا على Chromium)

إذا كان متصفحك **الافتراضي على النظام** مبنيًا على Chromium (Chrome/Brave/Edge/إلخ)،
فإن OpenClaw يستخدمه تلقائيًا. اضبط `browser.executablePath` لتجاوز
الاكتشاف التلقائي. يتم توسيع `~` إلى دليل المنزل الخاص بنظام التشغيل لديك:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

أو اضبطه في الإعدادات، حسب المنصة:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

يؤثر `executablePath` لكل ملف تعريف فقط في ملفات التعريف المحلية المُدارة التي
يشغّلها OpenClaw. أما ملفات التعريف `existing-session` فترتبط بمتصفح يعمل بالفعل
بدلًا من ذلك، بينما تستخدم ملفات تعريف CDP البعيدة المتصفح الموجود خلف `cdpUrl`.

## التحكم المحلي مقابل البعيد

- **التحكم المحلي (الافتراضي):** يبدأ Gateway خدمة التحكم عبر local loopback ويمكنه تشغيل متصفح محلي.
- **التحكم البعيد (مضيف Node):** شغّل مضيف Node على الجهاز الذي يحتوي على المتصفح؛ وسيقوم Gateway بتمرير إجراءات المتصفح إليه.
- **CDP البعيد:** اضبط `browser.profiles.<name>.cdpUrl` (أو `browser.cdpUrl`) من أجل
  الارتباط بمتصفح بعيد قائم على Chromium. في هذه الحالة، لن يقوم OpenClaw بتشغيل متصفح محلي.
- تؤثر `headless` فقط في ملفات التعريف المحلية المُدارة التي يشغّلها OpenClaw. وهي لا تعيد تشغيل متصفحات existing-session أو CDP البعيدة ولا تغيّرها.
- تتبع `executablePath` القاعدة نفسها الخاصة بملف التعريف المحلي المُدار. تغييرها على
  ملف تعريف محلي مُدار قيد التشغيل يضع علامة على هذا الملف لإعادة التشغيل/التسوية بحيث
  يستخدم التشغيل التالي الملف التنفيذي الجديد.

يختلف سلوك الإيقاف بحسب وضع ملف التعريف:

- ملفات التعريف المحلية المُدارة: يوقف `openclaw browser stop` عملية المتصفح التي
  شغّلها OpenClaw
- ملفات التعريف attach-only وCDP البعيدة: يغلق `openclaw browser stop` جلسة
  التحكم النشطة ويحرر تجاوزات المحاكاة Playwright/CDP (منفذ العرض،
  ونظام الألوان، والإعدادات المحلية، والمنطقة الزمنية، ووضع عدم الاتصال، والحالة المشابهة)، حتى
  إن لم تكن هناك عملية متصفح قد شغّلها OpenClaw

يمكن أن تتضمن عناوين URL الخاصة بـ CDP البعيد مصادقة:

- Query tokens (مثل `https://provider.example?token=<token>`)
- مصادقة HTTP Basic (مثل `https://user:pass@provider.example`)

يحافظ OpenClaw على المصادقة عند استدعاء نقاط النهاية `/json/*` وعند الاتصال
بـ CDP WebSocket. فضّل متغيرات البيئة أو مديري الأسرار لحفظ
الرموز بدلًا من تضمينها في ملفات الإعدادات.

## وكيل متصفح Node ‏(الافتراضي بلا إعدادات)

إذا كنت تشغّل **مضيف Node** على الجهاز الذي يوجد عليه متصفحك، يمكن لـ OpenClaw
توجيه استدعاءات أداة المتصفح تلقائيًا إلى ذلك الـ node من دون أي إعدادات متصفح إضافية.
وهذا هو المسار الافتراضي لـ Gateways البعيدة.

ملاحظات:

- يعرّض مضيف Node خادم التحكم المحلي في المتصفح عبر **أمر وكيل**.
- تأتي ملفات التعريف من إعدادات `browser.profiles` الخاصة بالـ node نفسه (مثل الإعداد المحلي).
- إن `nodeHost.browserProxy.allowProfiles` اختياري. اتركه فارغًا للحصول على السلوك القديم/الافتراضي: تظل جميع ملفات التعريف المضبوطة قابلة للوصول عبر الوكيل، بما في ذلك مسارات إنشاء/حذف ملفات التعريف.
- إذا قمت بضبط `nodeHost.browserProxy.allowProfiles`، فسيتعامل OpenClaw معها باعتبارها حدًا لأقل امتياز: لا يمكن استهداف إلا ملفات التعريف المدرجة في قائمة السماح، كما تُحظر مسارات إنشاء/حذف ملفات التعريف الدائمة على سطح الوكيل.
- عطّله إذا كنت لا تريده:
  - على الـ node: ‏`nodeHost.browserProxy.enabled=false`
  - على الـ gateway: ‏`gateway.nodes.browser.mode="off"`

## Browserless ‏(CDP بعيد مستضاف)

[Browserless](https://browserless.io) هي خدمة Chromium مستضافة تعرّض
عناوين URL لاتصال CDP عبر HTTPS وWebSocket. يمكن لـ OpenClaw استخدام أي من الشكلين، لكن
بالنسبة إلى ملف تعريف متصفح بعيد فإن أبسط خيار هو عنوان WebSocket المباشر
من وثائق الاتصال الخاصة بـ Browserless.

مثال:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

ملاحظات:

- استبدل `<BROWSERLESS_API_KEY>` برمز Browserless الحقيقي الخاص بك.
- اختر نقطة نهاية المنطقة المطابقة لحساب Browserless الخاص بك (راجع وثائقهم).
- إذا زوّدك Browserless بعنوان URL أساسي من نوع HTTPS، فيمكنك إما تحويله إلى
  `wss://` لاتصال CDP مباشر أو الاحتفاظ بعنوان HTTPS ودع OpenClaw
  يكتشف `/json/version`.

## مزودو CDP المباشر عبر WebSocket

تعرّض بعض خدمات المتصفح المستضافة نقطة نهاية **WebSocket مباشرة** بدلًا من
اكتشاف CDP القياسي القائم على HTTP ‏(`/json/version`). يقبل OpenClaw ثلاثة
أشكال لعناوين URL الخاصة بـ CDP ويختار إستراتيجية الاتصال المناسبة تلقائيًا:

- **اكتشاف HTTP(S)** — ‏`http://host[:port]` أو `https://host[:port]`.
  يستدعي OpenClaw ‏`/json/version` لاكتشاف عنوان WebSocket debugger URL، ثم
  يتصل. لا يوجد تبديل احتياطي إلى WebSocket.
- **نقاط نهاية WebSocket المباشرة** — ‏`ws://host[:port]/devtools/<kind>/<id>` أو
  `wss://...` مع مسار `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  يتصل OpenClaw مباشرة عبر مصافحة WebSocket ويتجاوز
  `/json/version` بالكامل.
- **جذور WebSocket العارية** — ‏`ws://host[:port]` أو `wss://host[:port]` من دون
  مسار `/devtools/...` (مثل [Browserless](https://browserless.io)،
  و[Browserbase](https://www.browserbase.com)). يحاول OpenClaw أولًا
  اكتشاف `/json/version` عبر HTTP
  (مع تطبيع المخطط إلى `http`/`https`)؛
  وإذا أعاد الاكتشاف `webSocketDebuggerUrl` فسيتم استخدامه، وإلا يعود OpenClaw
  إلى مصافحة WebSocket مباشرة عند الجذر العاري. وهذا يسمح
  لجذر `ws://` عارٍ يشير إلى Chrome محلي بأن يتصل أيضًا، لأن Chrome لا
  يقبل ترقيات WebSocket إلا على المسار المحدد لكل هدف القادم من
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) منصة سحابية لتشغيل
متصفحات headless مع حل CAPTCHA مدمج ووضع التخفي ووكلاء سكنيين.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

ملاحظات:

- [سجّل](https://www.browserbase.com/sign-up) وانسخ **مفتاح API**
  من [لوحة Overview](https://www.browserbase.com/overview).
- استبدل `<BROWSERBASE_API_KEY>` بمفتاح Browserbase API الحقيقي الخاص بك.
- ينشئ Browserbase جلسة متصفح تلقائيًا عند اتصال WebSocket، لذا
  لا حاجة إلى خطوة إنشاء جلسة يدوية.
- تسمح الفئة المجانية بجلسة متزامنة واحدة وساعة متصفح واحدة شهريًا.
  راجع [التسعير](https://www.browserbase.com/pricing) للاطلاع على حدود الخطط المدفوعة.
- راجع [وثائق Browserbase](https://docs.browserbase.com) للاطلاع على
  مرجع API الكامل، وأدلة SDK، وأمثلة التكامل.

## الأمان

الأفكار الأساسية:

- التحكم في المتصفح عبر local loopback فقط؛ ويتدفق الوصول من خلال مصادقة Gateway أو إقران الـ node.
- تستخدم واجهة HTTP المستقلة الخاصة بمتصفح loopback **مصادقة السر المشترك فقط**:
  bearer auth لرمز gateway، أو `x-openclaw-password`، أو مصادقة HTTP Basic مع
  كلمة المرور المضبوطة للـ gateway.
- ترويسات هوية Tailscale Serve و`gateway.auth.mode: "trusted-proxy"` لا
  تصادق **على** واجهة API المستقلة هذه الخاصة بمتصفح loopback.
- إذا كان التحكم في المتصفح مفعّلًا ولم يتم ضبط أي مصادقة بالسر المشترك، فإن OpenClaw
  ينشئ تلقائيًا `gateway.auth.token` عند بدء التشغيل ويحفظه في الإعدادات.
- لا ينشئ OpenClaw هذا الرمز تلقائيًا عندما تكون قيمة `gateway.auth.mode`
  بالفعل `password` أو `none` أو `trusted-proxy`.
- أبقِ Gateway وأي مضيفات node على شبكة خاصة (Tailscale)؛ وتجنب التعريض العام.
- تعامل مع عناوين URL/الرموز الخاصة بـ CDP البعيد على أنها أسرار؛ وفضّل متغيرات env أو مدير أسرار.

نصائح CDP البعيد:

- فضّل نقاط النهاية المشفرة (HTTPS أو WSS) والرموز قصيرة العمر عندما يكون ذلك ممكنًا.
- تجنب تضمين الرموز طويلة العمر مباشرة داخل ملفات الإعدادات.

## ملفات التعريف (متصفحات متعددة)

يدعم OpenClaw عدة ملفات تعريف مسماة (إعدادات توجيه). ويمكن أن تكون ملفات التعريف:

- **بإدارة OpenClaw**: مثيل متصفح مخصص قائم على Chromium مع دليل بيانات مستخدم خاص به + منفذ CDP
- **بعيد**: عنوان URL صريح لـ CDP ‏(متصفح قائم على Chromium يعمل في مكان آخر)
- **جلسة موجودة**: ملف تعريف Chrome الحالي لديك عبر الاتصال التلقائي لـ Chrome DevTools MCP

الإعدادات الافتراضية:

- يُنشأ ملف التعريف `openclaw` تلقائيًا إذا كان مفقودًا.
- ملف التعريف `user` مضمّن للإرفاق بجلسة موجودة عبر Chrome MCP.
- تكون ملفات التعريف existing-session اختيارية فيما عدا `user`؛ وأنشئها باستخدام `--driver existing-session`.
- تُخصّص منافذ CDP المحلية من **18800–18899** افتراضيًا.
- يؤدي حذف ملف تعريف إلى نقل دليل بياناته المحلي إلى المهملات.

تقبل جميع نقاط نهاية التحكم `?profile=<name>`؛ ويستخدم CLI الخيار `--browser-profile`.

## جلسة موجودة عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الارتباط بملف تعريف متصفح قائم على Chromium ويعمل بالفعل من خلال
خادم Chrome DevTools MCP الرسمي. ويعيد هذا استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة بالفعل في ملف تعريف المتصفح ذلك.

مراجع الخلفية والإعداد الرسمية:

- [Chrome for Developers: استخدام Chrome DevTools MCP مع جلسة المتصفح](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

ملف التعريف المضمّن:

- `user`

اختياري: أنشئ ملف تعريف existing-session مخصصًا إذا أردت
اسمًا مختلفًا أو لونًا مختلفًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- يستخدم ملف التعريف المضمّن `user` الاتصال التلقائي لـ Chrome MCP، والذي يستهدف
  ملف تعريف Google Chrome المحلي الافتراضي.

استخدم `userDataDir` لـ Brave أو Edge أو Chromium أو ملف تعريف Chrome غير الافتراضي:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

ثم في المتصفح المطابق:

1. افتح صفحة inspect الخاصة بذلك المتصفح لتصحيح الأخطاء عن بُعد.
2. فعّل تصحيح الأخطاء عن بُعد.
3. أبقِ المتصفح قيد التشغيل ووافق على مطالبة الاتصال عندما يرتبط OpenClaw.

صفحات inspect الشائعة:

- Chrome: ‏`chrome://inspect/#remote-debugging`
- Brave: ‏`brave://inspect/#remote-debugging`
- Edge: ‏`edge://inspect/#remote-debugging`

اختبار smoke للإرفاق المباشر:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

شكل النجاح:

- يعرض `status` القيمة `driver: existing-session`
- يعرض `status` القيمة `transport: chrome-mcp`
- يعرض `status` القيمة `running: true`
- يسرد `tabs` علامات التبويب المفتوحة بالفعل في متصفحك
- يعيد `snapshot` مراجع من علامة التبويب المباشرة المحددة

ما الذي يجب التحقق منه إذا لم يعمل الإرفاق:

- أن يكون إصدار المتصفح المستهدف القائم على Chromium هو `144+`
- أن يكون تصحيح الأخطاء عن بُعد مفعّلًا في صفحة inspect الخاصة بذلك المتصفح
- أن المتصفح قد عرض مطالبة الموافقة على الإرفاق وأنك قبلتها
- يقوم `openclaw doctor` بترحيل إعدادات المتصفح القديمة المعتمدة على الإضافة ويتحقق من
  أن Chrome مثبت محليًا لملفات التعريف الافتراضية ذات الاتصال التلقائي، لكنه لا يستطيع
  تفعيل تصحيح الأخطاء عن بُعد على جانب المتصفح بدلًا عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة المتصفح المسجّل دخول المستخدم فيها.
- إذا كنت تستخدم ملف تعريف existing-session مخصصًا، فمرّر اسم ملف التعريف الصريح هذا.
- اختر هذا الوضع فقط عندما يكون المستخدم موجودًا عند الجهاز للموافقة على
  مطالبة الإرفاق.
- يمكن لـ Gateway أو مضيف node تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- هذا المسار أعلى خطورة من ملف التعريف المعزول `openclaw` لأنه يمكنه
  تنفيذ إجراءات داخل جلسة المتصفح المسجّل دخولك فيها.
- لا يقوم OpenClaw بتشغيل المتصفح لهذا المشغّل؛ بل يرتبط به فقط.
- يستخدم OpenClaw هنا تدفق `--autoConnect` الرسمي الخاص بـ Chrome DevTools MCP. وإذا
  تم ضبط `userDataDir`، فسيتم تمريره لاستهداف دليل بيانات المستخدم هذا.
- يمكن لـ existing-session الارتباط على المضيف المحدد أو من خلال
  browser node متصل. إذا كان Chrome موجودًا في مكان آخر ولم يكن هناك browser node متصل، فاستخدم
  CDP البعيد أو مضيف node بدلًا من ذلك.

### تشغيل Chrome MCP مخصص

تجاوز خادم Chrome DevTools MCP الذي يتم تشغيله لكل ملف تعريف عندما لا يكون
التدفق الافتراضي `npx chrome-devtools-mcp@latest` هو ما تريده (في المضيفات غير المتصلة،
أو الإصدارات المثبتة، أو الثنائيات المورّدة):

| الحقل        | ما الذي يفعله                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | الملف التنفيذي الذي سيتم تشغيله بدلًا من `npx`. تتم معالجته كما هو؛ ويتم احترام المسارات المطلقة.                         |
| `mcpArgs`    | مصفوفة الوسائط التي يتم تمريرها حرفيًا إلى `mcpCommand`. تستبدل الوسائط الافتراضية `chrome-devtools-mcp@latest --autoConnect`. |

عندما يتم ضبط `cdpUrl` على ملف تعريف existing-session، يتخطى OpenClaw
`--autoConnect` ويمرر نقطة النهاية إلى Chrome MCP تلقائيًا:

- `http(s)://...` → `--browserUrl <url>` (نقطة نهاية اكتشاف DevTools عبر HTTP).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket مباشر).

لا يمكن الجمع بين أعلام نقطة النهاية و`userDataDir`: فعندما يتم ضبط `cdpUrl`،
يتم تجاهل `userDataDir` عند تشغيل Chrome MCP، لأن Chrome MCP يرتبط
بالمتصفح العامل خلف نقطة النهاية بدلًا من فتح دليل
ملف تعريف.

<Accordion title="قيود ميزات existing-session">

بالمقارنة مع ملف التعريف المُدار `openclaw`، تكون مشغلات existing-session أكثر تقييدًا:

- **لقطات الشاشة** — تعمل لقطات الصفحة ولقطات العناصر باستخدام `--ref`؛ لكن محددات CSS عبر `--element` لا تعمل. لا يمكن الجمع بين `--full-page` و`--ref` أو `--element`. لا تكون Playwright مطلوبة لالتقاط لقطات الصفحة أو العناصر المعتمدة على ref.
- **الإجراءات** — تتطلب `click` و`type` و`hover` و`scrollIntoView` و`drag` و`select` مراجع snapshot (من دون محددات CSS). تقوم `click-coords` بالنقر على إحداثيات مرئية في منفذ العرض ولا تتطلب مرجع snapshot. تعمل `click` بزر الفأرة الأيسر فقط. لا تدعم `type` القيمة `slowly=true`؛ استخدم `fill` أو `press`. لا تدعم `press` القيمة `delayMs`. لا تدعم `type` و`hover` و`scrollIntoView` و`drag` و`select` و`fill` و`evaluate` مهلات زمنية لكل استدعاء. تقبل `select` قيمة واحدة.
- **الانتظار / الرفع / الحوارات** — يدعم `wait --url` الأنماط المطابقة التامة والجزئية وglob؛ ولا يدعم `wait --load networkidle`. تتطلب خطافات الرفع `ref` أو `inputRef`، وملفًا واحدًا في كل مرة، ومن دون `element` باستخدام CSS. ولا تدعم خطافات الحوارات تجاوزات المهلة الزمنية.
- **الميزات الخاصة بالوضع المُدار فقط** — لا تزال الإجراءات الدفعية، وتصدير PDF، واعتراض التنزيلات، و`responsebody` تتطلب مسار المتصفح المُدار.

</Accordion>

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس ملف تعريف متصفحك الشخصي أبدًا.
- **منافذ مخصصة**: يتجنب `9222` لمنع التعارضات مع سير عمل التطوير.
- **تحكم حتمي في علامات التبويب**: تُرجع `tabs` أولًا `suggestedTargetId`، ثم
  مقابض `tabId` الثابتة مثل `t1`، والتسميات الاختيارية، و`targetId` الخام.
  يجب على الوكلاء إعادة استخدام `suggestedTargetId`؛ وتظل المعرّفات الخام متاحة
  لأغراض التصحيح والتوافق.

## اختيار المتصفح

عند التشغيل محليًا، يختار OpenClaw أول متصفح متاح:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

يمكنك التجاوز باستخدام `browser.executablePath`.

المنصات:

- macOS: يتحقق من `/Applications` و`~/Applications`.
- Linux: يتحقق من المواقع الشائعة لـ Chrome/Brave/Edge/Chromium ضمن `/usr/bin`،
  و`/snap/bin`، و`/opt/google`، و`/opt/brave.com`، و`/usr/lib/chromium`، و
  `/usr/lib/chromium-browser`.
- Windows: يتحقق من مواقع التثبيت الشائعة.

## واجهة API للتحكم (اختياري)

من أجل البرمجة النصية وتصحيح الأخطاء، يعرّض Gateway **واجهة HTTP
للتحكم عبر local loopback فقط** بالإضافة إلى CLI مطابقة هي `openclaw browser` (لقطات snapshots، ومراجع refs، وتعزيزات الانتظار، ومخرجات JSON، وسير عمل التصحيح). راجع
[واجهة API للتحكم في المتصفح](/ar/tools/browser-control) للحصول على المرجع الكامل.

## استكشاف الأخطاء وإصلاحها

للمشكلات الخاصة بـ Linux (وخاصة snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

لإعدادات المضيف المنقسم WSL2 Gateway + Windows Chrome، راجع
[استكشاف أخطاء WSL2 + Windows + CDP البعيد لـ Chrome وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء CDP مقابل حظر تنقل SSRF

هذان نوعان مختلفان من حالات الفشل ويشيران إلى مسارات برمجية مختلفة.

- **فشل بدء CDP أو جاهزيته** يعني أن OpenClaw لا يستطيع تأكيد أن مستوى التحكم في المتصفح سليم.
- **حظر تنقل SSRF** يعني أن مستوى التحكم في المتصفح سليم، لكن تم رفض هدف تنقل الصفحة بواسطة السياسة.

أمثلة شائعة:

- فشل بدء CDP أو جاهزيته:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- حظر تنقل SSRF:
  - تفشل تدفقات `open` أو `navigate` أو snapshot أو فتح علامات التبويب مع خطأ في سياسة المتصفح/الشبكة بينما يظل `start` و`tabs` يعملان

استخدم هذا التسلسل البسيط للتمييز بين الحالتين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشل `start` مع `not reachable after start`، فابدأ باستكشاف جاهزية CDP أولًا.
- إذا نجح `start` لكن فشل `tabs`، فلا يزال مستوى التحكم غير سليم. تعامل مع هذا على أنه مشكلة في قابلية الوصول إلى CDP، وليس مشكلة في تنقل الصفحات.
- إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فهذا يعني أن مستوى التحكم في المتصفح قائم وأن الفشل في سياسة التنقل أو الصفحة المستهدفة.
- إذا نجحت `start` و`tabs` و`open` جميعًا، فهذا يعني أن مسار التحكم الأساسي للمتصفح المُدار سليم.

تفاصيل سلوكية مهمة:

- تفترض إعدادات المتصفح افتراضيًا كائن سياسة SSRF مغلقًا عند الفشل حتى عندما لا تقوم بضبط `browser.ssrfPolicy`.
- بالنسبة إلى ملف التعريف المُدار المحلي `openclaw` عبر local loopback، تتخطى فحوصات سلامة CDP عمدًا فرض قابلية الوصول SSRF الخاصة بالمتصفح على مستوى التحكم المحلي الخاص بـ OpenClaw نفسه.
- تكون حماية التنقل منفصلة. إن نجاح `start` أو `tabs` لا يعني أن هدف `open` أو `navigate` اللاحق مسموح به.

إرشادات الأمان:

- **لا** تقم بإرخاء سياسة SSRF الخاصة بالمتصفح افتراضيًا.
- فضّل استثناءات مضيف ضيقة مثل `hostnameAllowlist` أو `allowedHostnames` بدلًا من الوصول الواسع إلى الشبكة الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في البيئات الموثوقة عمدًا حيث يكون الوصول إلى متصفح الشبكة الخاصة مطلوبًا ومراجَعًا.

## أدوات الوكيل + كيفية عمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

كيفية الربط:

- تُرجع `browser snapshot` شجرة واجهة مستخدم ثابتة (AI أو ARIA).
- تستخدم `browser act` معرّفات `ref` من snapshot من أجل click/type/drag/select.
- تلتقط `browser screenshot` البكسلات (صفحة كاملة، أو عنصر، أو مراجع موسومة).
- تتحقق `browser doctor` من جاهزية Gateway وPlugin وملف التعريف والمتصفح وعلامة التبويب.
- تقبل `browser`:
  - `profile` لاختيار ملف تعريف متصفح مسمى (openclaw أو chrome أو CDP بعيد).
  - `target` (`sandbox` | `host` | `node`) لتحديد مكان وجود المتصفح.
  - في الجلسات المعزولة، يتطلب `target: "host"` القيمة `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا تم حذف `target`: تفترض الجلسات المعزولة افتراضيًا `sandbox`، بينما تفترض الجلسات غير المعزولة `host`.
  - إذا كان هناك node قادر على تشغيل المتصفح متصل، فقد تقوم الأداة بتوجيه الطلب إليه تلقائيًا ما لم تثبّت `target="host"` أو `target="node"`.

يحافظ هذا على حتمية سلوك الوكيل ويتجنب المحددات الهشة.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [العزل](/ar/gateway/sandboxing) — التحكم في المتصفح داخل البيئات المعزولة
- [الأمان](/ar/gateway/security) — مخاطر التحكم في المتصفح ووسائل التحصين
