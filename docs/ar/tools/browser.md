---
read_when:
    - إضافة أتمتة متصفح يتحكم بها الوكيل
    - تصحيح سبب تداخل openclaw مع Chrome الخاص بك
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة التحكم المدمجة في المتصفح + أوامر الإجراءات
title: المتصفح (تحت إدارة OpenClaw)
x-i18n:
    generated_at: "2026-04-23T07:33:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865b0020d66366a62939f8ed28b9cda88d56ee7f5245b1b24a4e804ce55ea42d
    source_path: tools/browser.md
    workflow: 15
---

# المتصفح (تحت إدارة openclaw)

يمكن لـ OpenClaw تشغيل **ملف تعريف مخصص لـ Chrome/Brave/Edge/Chromium** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي ويُدار عبر خدمة تحكم محلية صغيرة
داخل Gateway (على local loopback فقط).

عرض للمبتدئين:

- فكّر فيه على أنه **متصفح منفصل خاص بالوكيل فقط**.
- لا يلمس ملف تعريف `openclaw` ملف تعريف متصفحك الشخصي.
- يمكن للوكيل **فتح علامات تبويب، وقراءة الصفحات، والنقر، والكتابة** في مسار آمن.
- يرتبط ملف تعريف `user` المضمن بجلسة Chrome الحقيقية المسجّل دخولها عبر Chrome MCP.

## ما الذي تحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** (بلون تمييز برتقالي افتراضيًا).
- تحكم حتمي في علامات التبويب (عرض/فتح/تركيز/إغلاق).
- إجراءات الوكيل (النقر/الكتابة/السحب/التحديد)، ولقطات snapshots، ولقطات شاشة، وملفات PDF.
- دعم اختياري لملفات تعريف متعددة (`openclaw` و`work` و`remote` و...).

هذا المتصفح **ليس** متصفحك اليومي. إنه سطح آمن ومعزول
لأتمتة الوكيل والتحقق.

## بدء سريع

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

إذا ظهرت لك عبارة “Browser disabled”، فقم بتمكينه في الإعدادات (انظر أدناه) ثم أعد تشغيل
Gateway.

إذا كان `openclaw browser` مفقودًا بالكامل، أو قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر المتصفح أو الأداة مفقودان](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم عبر Plugin

أصبحت أداة `browser` الافتراضية الآن Plugin مجمعة تُشحن مفعلة
افتراضيًا. وهذا يعني أنه يمكنك تعطيلها أو استبدالها دون إزالة بقية
نظام Plugins في OpenClaw:

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

عطّل Plugin المجمعة قبل تثبيت Plugin أخرى توفر
اسم أداة `browser` نفسه. وتتطلب تجربة المتصفح الافتراضية كليهما:

- ألا تكون `plugins.entries.browser.enabled` معطلة
- `browser.enabled=true`

إذا عطلت Plugin فقط، فإن CLI المتصفح المجمعة (`openclaw browser`)،
وطريقة gateway (`browser.request`)، وأداة الوكيل، وخدمة التحكم الافتراضية في المتصفح
كلها تختفي معًا. بينما تبقى إعدادات `browser.*` سليمة لتعيد
Plugin بديلة استخدامها.

كما تمتلك Plugin المتصفح المجمعة الآن تنفيذ وقت تشغيل المتصفح.
ويحتفظ core فقط بمساعدات Plugin SDK المشتركة بالإضافة إلى عمليات إعادة تصدير
للتوافق مع مسارات الاستيراد الداخلية الأقدم. وعمليًا، فإن إزالة أو استبدال
حزمة Plugin المتصفح يزيل مجموعة ميزات المتصفح بدلًا من ترك وقت تشغيل
ثانٍ مملوك لـ core في الخلفية.

ولا تزال تغييرات إعدادات المتصفح تتطلب إعادة تشغيل Gateway حتى تتمكن Plugin المجمعة
من إعادة تسجيل خدمة المتصفح بالإعدادات الجديدة.

## أمر المتصفح أو الأداة مفقودان

إذا أصبح `openclaw browser` فجأة أمرًا غير معروف بعد ترقية، أو
أبلغ الوكيل بأن أداة المتصفح مفقودة، فالسبب الأكثر شيوعًا هو وجود
قائمة `plugins.allow` مقيِّدة لا تتضمن `browser`.

مثال على إعدادات معطلة:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

أصلح ذلك بإضافة `browser` إلى قائمة سماح Plugins:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

ملاحظات مهمة:

- لا يكفي `browser.enabled=true` وحده عندما تكون `plugins.allow` معيّنة.
- لا يكفي `plugins.entries.browser.enabled=true` وحده أيضًا عندما تكون `plugins.allow` معيّنة.
- لا يقوم `tools.alsoAllow: ["browser"]` بتحميل Plugin المتصفح المجمعة. فهو يضبط فقط سياسة الأداة بعد أن تكون Plugin قد حُمّلت بالفعل.
- إذا لم تكن بحاجة إلى قائمة سماح Plugins مقيِّدة، فإن إزالة `plugins.allow` تعيد أيضًا سلوك المتصفح المجمعة الافتراضي.

الأعراض المعتادة:

- `openclaw browser` أمر غير معروف.
- `browser.request` مفقودة.
- يبلغ الوكيل أن أداة المتصفح غير متاحة أو مفقودة.

## الملفات الشخصية: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (ولا يتطلب أي إضافة).
- `user`: ملف تعريف ارتباط Chrome MCP المضمن الخاص بـ **جلسة Chrome الحقيقية المسجَّل دخولها**
  لديك.

بالنسبة إلى استدعاءات أداة المتصفح من الوكيل:

- الافتراضي: استخدم متصفح `openclaw` المعزول.
- فضّل `profile="user"` عندما تكون الجلسات المسجّل دخولها بالفعل مهمة وكان المستخدم
  أمام الكمبيوتر للنقر/الموافقة على أي مطالبة ارتباط.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددًا.

اضبط `browser.defaultProfile: "openclaw"` إذا كنت تريد الوضع المُدار افتراضيًا.

## الإعدادات

توجد إعدادات المتصفح في `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // الافتراضي: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // اشتراك اختياري فقط للوصول الموثوق إلى الشبكات الخاصة
      // allowPrivateNetwork: true, // اسم مستعار قديم
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // تجاوز قديم لملف تعريف واحد
    remoteCdpTimeoutMs: 1500, // مهلة HTTP لـ CDP البعيدة (مللي ثانية)
    remoteCdpHandshakeTimeoutMs: 3000, // مهلة مصافحة WebSocket لـ CDP البعيدة (مللي ثانية)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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

ملاحظات:

- ترتبط خدمة التحكم في المتصفح على local loopback على منفذ مشتق من `gateway.port`
  (الافتراضي: `18791`، أي gateway + 2).
- إذا تجاوزت منفذ Gateway (`gateway.port` أو `OPENCLAW_GATEWAY_PORT`)،
  فإن منافذ المتصفح المشتقة تتحرك للحفاظ على بقائها ضمن «العائلة» نفسها.
- تكون القيمة الافتراضية لـ `cdpUrl` هي منفذ CDP المحلي المُدار عندما لا يكون معيّنًا.
- تنطبق `remoteCdpTimeoutMs` على فحوصات الوصول إلى CDP البعيدة (غير loopback).
- تنطبق `remoteCdpHandshakeTimeoutMs` على فحوصات الوصول إلى WebSocket الخاصة بـ CDP البعيدة.
- يتم حراسة تنقل المتصفح/فتح علامة تبويب ضد SSRF قبل التنقل ويُعاد التحقق منها بأفضل جهد على عنوان URL النهائي `http(s)` بعد التنقل.
- في وضع SSRF الصارم، يتم أيضًا فحص اكتشاف/فحوص نقاط نهاية CDP البعيدة (`cdpUrl`، بما في ذلك عمليات البحث عن `/json/version`).
- تكون `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلة افتراضيًا. اضبطها على `true` فقط عندما تثق عمدًا في وصول المتصفح إلى الشبكات الخاصة.
- لا يزال `browser.ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم للتوافق.
- تعني `attachOnly: true` «لا تطلق متصفحًا محليًا أبدًا؛ فقط اتصل به إذا كان يعمل بالفعل».
- يلوّن `color` + `color` لكل ملف تعريف واجهة المستخدم الخاصة بالمتصفح بحيث يمكنك رؤية الملف النشط.
- يكون الملف الافتراضي هو `openclaw` (متصفح مستقل تحت إدارة OpenClaw). استخدم `defaultProfile: "user"` للاشتراك في متصفح المستخدم المسجّل دخوله.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي للنظام إذا كان قائمًا على Chromium؛ وإلا Chrome → Brave → Edge → Chromium → Chrome Canary.
- تقوم ملفات `openclaw` المحلية بتعيين `cdpPort`/`cdpUrl` تلقائيًا — ولا تضبط هذه القيم إلا لـ CDP البعيد.
- يستخدم `driver: "existing-session"` Chrome DevTools MCP بدلًا من CDP الخام. لا
  تضبط `cdpUrl` لهذا driver.
- اضبط `browser.profiles.<name>.userDataDir` عندما يجب أن يرتبط ملف تعريف
  existing-session بملف تعريف مستخدم غير افتراضي قائم على Chromium مثل Brave أو Edge.

## استخدم Brave (أو متصفحًا آخر قائمًا على Chromium)

إذا كان متصفحك **الافتراضي في النظام** قائمًا على Chromium (مثل Chrome/Brave/Edge/إلخ)،
فإن OpenClaw يستخدمه تلقائيًا. واضبط `browser.executablePath` لتجاوز
الاكتشاف التلقائي:

مثال CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## التحكم المحلي مقابل البعيد

- **التحكم المحلي (الافتراضي):** تبدأ Gateway خدمة التحكم على loopback ويمكنها تشغيل متصفح محلي.
- **التحكم البعيد (مضيف node):** شغّل مضيف node على الجهاز الذي يحتوي على المتصفح؛ وستقوم Gateway بتمرير إجراءات المتصفح إليه.
- **CDP البعيد:** اضبط `browser.profiles.<name>.cdpUrl` (أو `browser.cdpUrl`) من أجل
  الارتباط بمتصفح بعيد قائم على Chromium. وفي هذه الحالة، لن يشغّل OpenClaw متصفحًا محليًا.

يختلف سلوك الإيقاف بحسب وضع الملف الشخصي:

- الملفات الشخصية المحلية المُدارة: يقوم `openclaw browser stop` بإيقاف عملية المتصفح التي
  أطلقها OpenClaw
- ملفات attach-only وCDP البعيدة: يقوم `openclaw browser stop` بإغلاق جلسة التحكم
  النشطة وتحرير تجاوزات المحاكاة الخاصة بـ Playwright/CDP (منفذ العرض،
  ومخطط الألوان، واللغة المحلية، والمنطقة الزمنية، ووضع عدم الاتصال، والحالة المشابهة)،
  رغم أنه لم يتم إطلاق أي عملية متصفح بواسطة OpenClaw

يمكن أن تتضمن عناوين URL الخاصة بـ CDP البعيدة تفويضًا:

- رموزًا في الاستعلام (مثل `https://provider.example?token=<token>`)
- تفويض HTTP Basic (مثل `https://user:pass@provider.example`)

يحافظ OpenClaw على هذا التفويض عند استدعاء نقاط النهاية `/json/*` وعند الاتصال
بـ CDP WebSocket. ويفضل استخدام متغيرات البيئة أو مديري الأسرار للرموز
بدلًا من حفظها في ملفات الإعدادات.

## وكيل متصفح node (الافتراضي بدون إعداد)

إذا كنت تشغّل **مضيف node** على الجهاز الذي يحتوي على متصفحك، فيمكن لـ OpenClaw
توجيه استدعاءات أداة المتصفح تلقائيًا إلى تلك node من دون أي إعدادات متصفح إضافية.
وهذا هو المسار الافتراضي لـ Gateways البعيدة.

ملاحظات:

- يكشف مضيف node خدمة التحكم المحلية في المتصفح عبر **أمر وكيل**.
- تأتي الملفات الشخصية من إعدادات `browser.profiles` الخاصة بـ node نفسها (مثل المحلي تمامًا).
- تكون `nodeHost.browserProxy.allowProfiles` اختيارية. اتركها فارغة للحصول على السلوك القديم/الافتراضي: تظل جميع الملفات الشخصية المُعدة قابلة للوصول عبر الوكيل، بما في ذلك مسارات إنشاء/حذف الملفات الشخصية.
- إذا قمت بتعيين `nodeHost.browserProxy.allowProfiles`، فإن OpenClaw تتعامل معها كحد أقل امتيازًا: لا يمكن استهداف إلا الملفات الشخصية المدرجة في قائمة السماح، كما تُحظر مسارات إنشاء/حذف الملفات الشخصية الدائمة على سطح الوكيل.
- عطّلها إذا كنت لا تريدها:
  - على node: `nodeHost.browserProxy.enabled=false`
  - على gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP بعيد مستضاف)

[Browserless](https://browserless.io) هي خدمة Chromium مستضافة تكشف
عناوين اتصال CDP عبر HTTPS وWebSocket. ويمكن لـ OpenClaw استخدام أي من الشكلين، لكن
بالنسبة إلى ملف تعريف متصفح بعيد فإن أبسط خيار هو عنوان WebSocket المباشر
من وثائق الاتصال في Browserless.

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
- اختر نقطة نهاية المنطقة التي تطابق حساب Browserless الخاص بك (راجع وثائقهم).
- إذا أعطاك Browserless عنوان HTTPS أساسيًا، فيمكنك إما تحويله إلى
  `wss://` لاتصال CDP مباشر أو الإبقاء على عنوان HTTPS وترك OpenClaw
  يكتشف `/json/version`.

## مزودو WebSocket CDP المباشرون

تعرض بعض خدمات المتصفح المستضافة نقطة نهاية **WebSocket مباشرة** بدلًا من
اكتشاف CDP القياسي المعتمد على HTTP (`/json/version`). يقبل OpenClaw ثلاثة
أشكال لعناوين CDP URL ويختار استراتيجية الاتصال المناسبة تلقائيًا:

- **اكتشاف HTTP(S)** — ‏`http://host[:port]` أو `https://host[:port]`.
  يستدعي OpenClaw المسار `/json/version` لاكتشاف عنوان WebSocket debugger، ثم
  يتصل. ولا يوجد احتياط إلى WebSocket.
- **نقاط نهاية WebSocket المباشرة** — ‏`ws://host[:port]/devtools/<kind>/<id>` أو
  `wss://...` مع مسار `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  يتصل OpenClaw مباشرة عبر مصافحة WebSocket ويتجاوز
  `/json/version` بالكامل.
- **جذور WebSocket العارية** — ‏`ws://host[:port]` أو `wss://host[:port]` من دون
  مسار `/devtools/...` (مثل [Browserless](https://browserless.io)،
  و[Browserbase](https://www.browserbase.com)). يحاول OpenClaw اكتشاف
  `/json/version` عبر HTTP أولًا (مع تطبيع المخطط إلى `http`/`https`)؛
  فإذا أعاد الاكتشاف قيمة `webSocketDebuggerUrl` يتم استخدامها، وإلا فإن OpenClaw
  يحتاط إلى مصافحة WebSocket مباشرة عند الجذر العاري. ويغطي هذا
  كلاً من منافذ التصحيح البعيد بأسلوب Chrome والمزوّدين الذين يدعمون WebSocket فقط.

إن استخدام `ws://host:port` / `wss://host:port` العاريين من دون مسار `/devtools/...`
عند توجيههما إلى نسخة Chrome محلية يكون مدعومًا عبر
الاحتياط القائم على الاكتشاف أولًا — إذ لا يقبل Chrome ترقيات WebSocket إلا على
المسار المحدد لكل متصفح أو لكل هدف الذي يعيده `/json/version`، لذا فإن المصافحة
عند الجذر العاري وحدها ستفشل.

### Browserbase

[Browserbase](https://www.browserbase.com) هي منصة سحابية لتشغيل
متصفحات headless مع حل CAPTCHA مدمج، ووضع stealth، ووكلاء residential proxies.

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

- [سجّل](https://www.browserbase.com/sign-up) وانسخ **API Key**
  من [لوحة Overview](https://www.browserbase.com/overview).
- استبدل `<BROWSERBASE_API_KEY>` بمفتاح Browserbase API الحقيقي.
- تنشئ Browserbase جلسة متصفح تلقائيًا عند الاتصال عبر WebSocket، لذا لا
  حاجة إلى خطوة إنشاء جلسة يدوية.
- تسمح الخطة المجانية بجلسة متزامنة واحدة وساعة متصفح واحدة شهريًا.
  راجع [الأسعار](https://www.browserbase.com/pricing) لمعرفة حدود الخطط المدفوعة.
- راجع [وثائق Browserbase](https://docs.browserbase.com) للحصول على مرجع API
  الكامل، وأدلة SDK، وأمثلة التكامل.

## الأمان

الأفكار الأساسية:

- يكون التحكم في المتصفح على local loopback فقط؛ ويمر الوصول عبر تفويض Gateway أو اقتران node.
- تستخدم واجهة HTTP API الخاصة بالمتصفح على loopback **تفويض السر المشترك فقط**:
  bearer token لـ gateway، أو `x-openclaw-password`، أو HTTP Basic auth باستخدام
  كلمة مرور gateway المُعدة.
- لا تقوم ترويسات هوية Tailscale Serve ولا `gateway.auth.mode: "trusted-proxy"` بـ
  تفويض واجهة API المستقلة هذه الخاصة بالمتصفح على loopback.
- إذا كان التحكم في المتصفح مفعّلًا ولم يتم إعداد تفويض سر مشترك، فإن OpenClaw
  يولّد `gateway.auth.token` تلقائيًا عند بدء التشغيل ويحفظه في الإعدادات.
- لا يقوم OpenClaw بتوليد هذا الرمز المميز تلقائيًا عندما يكون `gateway.auth.mode`
  بالفعل `password` أو `none` أو `trusted-proxy`.
- أبقِ Gateway وأي مضيفات node على شبكة خاصة (Tailscale)؛ وتجنب التعرض العام.
- تعامل مع عناوين/رموز CDP البعيدة كأسرار؛ ويفضل استخدام متغيرات env أو مدير أسرار.

نصائح CDP البعيدة:

- فضّل نقاط النهاية المشفرة (HTTPS أو WSS) والرموز قصيرة العمر عند الإمكان.
- تجنب تضمين الرموز طويلة العمر مباشرة في ملفات الإعدادات.

## الملفات الشخصية (متصفحات متعددة)

يدعم OpenClaw عدة ملفات تعريف مسماة (إعدادات توجيه). يمكن أن تكون الملفات الشخصية:

- **تحت إدارة openclaw**: نسخة متصفح مخصصة قائمة على Chromium مع دليل بيانات مستخدم خاص بها + منفذ CDP
- **بعيدة**: عنوان CDP URL صريح (متصفح قائم على Chromium يعمل في مكان آخر)
- **جلسة موجودة**: ملف Chrome الشخصي الموجود لديك عبر الاتصال التلقائي بـ Chrome DevTools MCP

الإعدادات الافتراضية:

- يتم إنشاء ملف تعريف `openclaw` تلقائيًا إذا كان مفقودًا.
- ملف تعريف `user` مضمن للارتباط بجلسة موجودة عبر Chrome MCP.
- ملفات existing-session الشخصية اختيارية إلى جانب `user`؛ وأنشئها باستخدام `--driver existing-session`.
- يتم تخصيص منافذ CDP المحلية من **18800–18899** افتراضيًا.
- يؤدي حذف ملف تعريف إلى نقل دليل بياناته المحلي إلى Trash.

تقبل جميع نقاط نهاية التحكم `?profile=<name>`؛ ويستخدم CLI العلم `--browser-profile`.

## Existing-session عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الارتباط بملف تعريف متصفح Chromium-based قيد التشغيل عبر
خادم Chrome DevTools MCP الرسمي. ويعيد هذا استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة بالفعل في ملف تعريف المتصفح ذلك.

مراجع رسمية للخلفية والإعداد:

- [Chrome for Developers: استخدام Chrome DevTools MCP مع جلسة متصفحك](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [ملف README الخاص بـ Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

الملف الشخصي المضمن:

- `user`

اختياري: أنشئ ملف existing-session مخصصًا إذا كنت تريد
اسمًا مختلفًا أو لونًا مختلفًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- يستخدم الملف الشخصي المضمن `user` الاتصال التلقائي عبر Chrome MCP، والذي يستهدف
  ملف Google Chrome المحلي الافتراضي.

استخدم `userDataDir` لـ Brave أو Edge أو Chromium أو ملف تعريف Chrome غير افتراضي:

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

1. افتح صفحة الفحص الخاصة بذلك المتصفح للتصحيح البعيد.
2. فعّل التصحيح البعيد.
3. أبقِ المتصفح قيد التشغيل ووافق على مطالبة الاتصال عندما يرتبط OpenClaw.

صفحات الفحص الشائعة:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

اختبار smoke للارتباط المباشر:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

كيف يبدو النجاح:

- يعرض `status` القيمة `driver: existing-session`
- يعرض `status` القيمة `transport: chrome-mcp`
- يعرض `status` القيمة `running: true`
- يعرض `tabs` علامات التبويب المفتوحة لديك بالفعل
- يعيد `snapshot` مراجع refs من علامة التبويب الحية المحددة

ما الذي يجب التحقق منه إذا لم يعمل الارتباط:

- أن يكون إصدار المتصفح المستهدف القائم على Chromium هو `144+`
- أن يكون التصحيح البعيد مفعّلًا في صفحة الفحص الخاصة بذلك المتصفح
- أن يكون المتصفح قد عرض مطالبة الموافقة على الارتباط وأنك وافقت عليها
- يقوم `openclaw doctor` بترحيل إعدادات المتصفح القديمة القائمة على الإضافات ويتحقق من
  أن Chrome مثبت محليًا لملفات الاتصال التلقائي الافتراضية، لكنه لا يمكنه
  تمكين التصحيح البعيد على جانب المتصفح نيابةً عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة المتصفح المسجّل دخول المستخدم فيها.
- إذا كنت تستخدم ملف existing-session مخصصًا، فمرر اسم ذلك الملف الصريح.
- اختر هذا الوضع فقط عندما يكون المستخدم أمام الكمبيوتر للموافقة على مطالبة
  الارتباط.
- يمكن لـ Gateway أو مضيف node تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- يُعد هذا المسار أعلى خطورة من ملف `openclaw` المعزول لأنه يمكنه
  العمل داخل جلسة المتصفح المسجَّل دخولك فيها.
- لا يقوم OpenClaw بتشغيل المتصفح لهذا driver؛ بل يرتبط
  بجلسة موجودة فقط.
- يستخدم OpenClaw هنا تدفق `--autoConnect` الرسمي الخاص بـ Chrome DevTools MCP. وإذا
  تم تعيين `userDataDir`، فإن OpenClaw يمرره لاستهداف
  دليل بيانات مستخدم Chromium ذلك بشكل صريح.
- تدعم لقطات الشاشة في existing-session التقاط الصفحة وعمليات التقاط العناصر عبر `--ref`
  من snapshots، ولكنها لا تدعم محددات CSS `--element`.
- تعمل لقطات الشاشة للصفحة في existing-session من دون Playwright عبر Chrome MCP.
  كما تعمل لقطات العناصر المعتمدة على ref (`--ref`) هناك أيضًا، لكن لا يمكن
  الجمع بين `--full-page` و`--ref` أو `--element`.
- لا تزال إجراءات existing-session أكثر محدودية من مسار
  المتصفح المُدار:
  - تتطلب `click` و`type` و`hover` و`scrollIntoView` و`drag` و`select`
    snapshot refs بدلًا من CSS selectors
  - تكون `click` بزر الماوس الأيسر فقط (من دون تجاوزات للأزرار أو modifiers)
  - لا تدعم `type` القيمة `slowly=true`؛ استخدم `fill` أو `press`
  - لا تدعم `press` القيمة `delayMs`
  - لا تدعم `hover` و`scrollIntoView` و`drag` و`select` و`fill` و`evaluate`
    تجاوزات المهلة لكل استدعاء
  - تدعم `select` حاليًا قيمة واحدة فقط
- تدعم `wait --url` في existing-session المطابقة التامة، والمطابقة الجزئية، وأنماط glob
  مثل برامج تشغيل المتصفح الأخرى. ولا يزال `wait --load networkidle` غير مدعوم.
- تتطلب خطافات الرفع في existing-session وجود `ref` أو `inputRef`، وتدعم ملفًا واحدًا
  في كل مرة، ولا تدعم استهداف CSS `element`.
- لا تدعم خطافات الحوارات في existing-session تجاوزات المهلة.
- لا تزال بعض الميزات تتطلب مسار المتصفح المُدار، بما في ذلك
  الإجراءات الدفعية، وتصدير PDF، واعتراض التنزيلات، و`responsebody`.
- يمكن لـ existing-session الارتباط على المضيف المحدد أو عبر
  browser node متصلة. وإذا كان Chrome موجودًا في مكان آخر ولم تكن هناك browser node متصلة، فاستخدم
  CDP البعيد أو مضيف node بدلًا من ذلك.

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس ملف تعريف متصفحك الشخصي مطلقًا.
- **منافذ مخصصة**: تتجنب `9222` لمنع التعارضات مع سير العمل التطويري.
- **تحكم حتمي في علامات التبويب**: يستهدف علامات التبويب عبر `targetId`، وليس «آخر علامة تبويب».

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
- Linux: يبحث عن `google-chrome` و`brave` و`microsoft-edge` و`chromium` وما إلى ذلك.
- Windows: يتحقق من مواقع التثبيت الشائعة.

## واجهة Control API (اختيارية)

للتكاملات المحلية فقط، تكشف Gateway واجهة HTTP API صغيرة على loopback:

- الحالة/البدء/الإيقاف: `GET /` و`POST /start` و`POST /stop`
- علامات التبويب: `GET /tabs` و`POST /tabs/open` و`POST /tabs/focus` و`DELETE /tabs/:targetId`
- snapshot/لقطة الشاشة: `GET /snapshot` و`POST /screenshot`
- الإجراءات: `POST /navigate` و`POST /act`
- الخطافات: `POST /hooks/file-chooser` و`POST /hooks/dialog`
- التنزيلات: `POST /download` و`POST /wait/download`
- التصحيح: `GET /console` و`POST /pdf`
- التصحيح: `GET /errors` و`GET /requests` و`POST /trace/start` و`POST /trace/stop` و`POST /highlight`
- الشبكة: `POST /response/body`
- الحالة: `GET /cookies` و`POST /cookies/set` و`POST /cookies/clear`
- الحالة: `GET /storage/:kind` و`POST /storage/:kind/set` و`POST /storage/:kind/clear`
- الإعدادات: `POST /set/offline` و`POST /set/headers` و`POST /set/credentials` و`POST /set/geolocation` و`POST /set/media` و`POST /set/timezone` و`POST /set/locale` و`POST /set/device`

تقبل جميع نقاط النهاية `?profile=<name>`.

إذا تم إعداد تفويض gateway بالسر المشترك، فإن مسارات HTTP الخاصة بالمتصفح تتطلب التفويض أيضًا:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو HTTP Basic auth باستخدام كلمة المرور تلك

ملاحظات:

- لا تستهلك واجهة API هذه المستقلة الخاصة بالمتصفح على loopback تفويض trusted-proxy ولا
  ترويسات هوية Tailscale Serve.
- إذا كانت `gateway.auth.mode` هي `none` أو `trusted-proxy`، فإن مسارات متصفح loopback هذه
  لا ترث أوضاع الهوية تلك؛ وأبقِها على loopback فقط.

### عقد الأخطاء الخاص بـ `/act`

يستخدم `POST /act` استجابة خطأ مهيكلة لفشل التحقق على مستوى المسار
وفشل السياسة:

```json
{ "error": "<message>", "code": "ACT_*" }
```

قيم `code` الحالية:

- `ACT_KIND_REQUIRED` (HTTP 400): القيمة `kind` مفقودة أو غير معروفة.
- `ACT_INVALID_REQUEST` (HTTP 400): فشلت حمولة الإجراء في التطبيع أو التحقق.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): تم استخدام `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` (HTTP 403): تم تعطيل `evaluate` (أو `wait --fn`) عبر الإعدادات.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): يتعارض `targetId` على المستوى الأعلى أو داخل الدفعة مع هدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): الإجراء غير مدعوم لملفات existing-session الشخصية.

يمكن أن تعيد أعطال وقت التشغيل الأخرى أيضًا `{ "error": "<message>" }` من دون
حقل `code`.

### متطلب Playwright

تتطلب بعض الميزات (navigate/act/AI snapshot/role snapshot، ولقطات عناصر الشاشة،
وPDF) وجود Playwright. وإذا لم تكن Playwright مثبتة، فتعيد نقاط النهاية هذه خطأ 501 واضحًا.

ما الذي لا يزال يعمل من دون Playwright:

- ARIA snapshots
- لقطات شاشة الصفحة للمتصفح `openclaw` المُدار عندما يكون WebSocket
  CDP لكل علامة تبويب متاحًا
- لقطات شاشة الصفحة لملفات `existing-session` / Chrome MCP الشخصية
- لقطات الشاشة المعتمدة على ref (`--ref`) في `existing-session` من خرج snapshot

ما الذي لا يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- لقطات عناصر الشاشة عبر CSS-selector (`--element`)
- تصدير PDF الكامل للمتصفح

كما ترفض لقطات عناصر الشاشة أيضًا `--full-page`؛ ويعيد المسار الرسالة `fullPage is
not supported for element screenshots`.

إذا رأيت `Playwright is not available in this gateway build`، فأصلح تبعيات وقت تشغيل
Plugin المتصفح المجمعة بحيث يتم تثبيت `playwright-core`،
ثم أعد تشغيل gateway. وبالنسبة إلى عمليات التثبيت المجمعة، شغّل `openclaw doctor --fix`.
أما في Docker، فقم أيضًا بتثبيت ملفات Chromium browser الثنائية كما هو موضح أدناه.

#### تثبيت Playwright في Docker

إذا كانت Gateway تعمل داخل Docker، فتجنب `npx playwright` (تعارضات تجاوز npm).
واستخدم CLI المجمعة بدلًا من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

للاحتفاظ بتنزيلات المتصفح، اضبط `PLAYWRIGHT_BROWSERS_PATH` (على سبيل المثال،
`/home/node/.cache/ms-playwright`) وتأكد من حفظ `/home/node` عبر
`OPENCLAW_HOME_VOLUME` أو bind mount. راجع [Docker](/ar/install/docker).

## كيف يعمل (داخليًا)

التدفق عالي المستوى:

- يقبل **خادم تحكم** صغير طلبات HTTP.
- ويتصل بمتصفحات Chromium-based (Chrome/Brave/Edge/Chromium) عبر **CDP**.
- وبالنسبة إلى الإجراءات المتقدمة (النقر/الكتابة/snapshot/PDF)، فإنه يستخدم **Playwright** فوق
  CDP.
- وعندما تكون Playwright مفقودة، لا تتوفر إلا العمليات غير المعتمدة على Playwright.

يحافظ هذا التصميم على الوكيل على واجهة ثابتة وحتمية مع السماح
لك بتبديل المتصفحات والملفات الشخصية المحلية/البعيدة.

## مرجع CLI سريع

تقبل جميع الأوامر `--browser-profile <name>` لاستهداف ملف تعريف محدد.
كما تقبل جميع الأوامر أيضًا `--json` للإخراج القابل للقراءة آليًا (بحمولات مستقرة).

الأساسيات:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

الفحص:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

ملاحظة حول دورة الحياة:

- بالنسبة إلى ملفات attach-only وCDP البعيدة، يظل `openclaw browser stop`
  هو أمر التنظيف الصحيح بعد الاختبارات. فهو يغلق جلسة التحكم النشطة
  ويمسح تجاوزات المحاكاة المؤقتة بدلًا من قتل
  المتصفح الأساسي.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

الإجراءات:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

الحالة:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

ملاحظات:

- `upload` و`dialog` هما استدعاءان من نوع **arming**؛ شغّلهما قبل النقر/الضغط
  الذي يطلق chooser/dialog.
- تكون مسارات خرج التنزيل والتتبع مقيّدة بجذور temp الخاصة بـ OpenClaw:
  - traces: ‏`/tmp/openclaw` (الاحتياط: `${os.tmpdir()}/openclaw`)
  - downloads: ‏`/tmp/openclaw/downloads` (الاحتياط: `${os.tmpdir()}/openclaw/downloads`)
- تكون مسارات الرفع مقيّدة بجذر temp uploads الخاص بـ OpenClaw:
  - uploads: ‏`/tmp/openclaw/uploads` (الاحتياط: `${os.tmpdir()}/openclaw/uploads`)
- يمكن لـ `upload` أيضًا تعيين file inputs مباشرة عبر `--input-ref` أو `--element`.
- `snapshot`:
  - `--format ai` (الافتراضي عند تثبيت Playwright): يعيد AI snapshot مع refs رقمية (`aria-ref="<n>"`).
  - `--format aria`: يعيد شجرة إمكانية الوصول (من دون refs؛ للفحص فقط).
  - `--efficient` (أو `--mode efficient`): إعداد role snapshot مضغوط مسبقًا (interactive + compact + depth + maxChars أقل).
  - الإعداد الافتراضي في config (للأداة/CLI فقط): اضبط `browser.snapshotDefaults.mode: "efficient"` لاستخدام snapshots فعالة عندما لا يمرر المستدعي وضعًا (راجع [إعدادات Gateway](/ar/gateway/configuration-reference#browser)).
  - تفرض خيارات Role snapshot (`--interactive` و`--compact` و`--depth` و`--selector`) role-based snapshot مع refs مثل `ref=e12`.
  - يقوم `--frame "<iframe selector>"` بتحديد role snapshots ضمن iframe (ويقترن مع role refs مثل `e12`).
  - يُخرج `--interactive` قائمة مسطحة وسهلة الاختيار للعناصر التفاعلية (وهي الأفضل لقيادة الإجراءات).
  - يضيف `--labels` لقطة شاشة خاصة بمنفذ العرض فقط مع تسميات refs متراكبة (ويطبع `MEDIA:<path>`).
- تتطلب `click`/`type`/إلخ قيمة `ref` من `snapshot` (إما رقمية `12` أو role ref `e12`).
  ولا تُدعم محددات CSS عمدًا بالنسبة إلى الإجراءات.

## Snapshots وrefs

يدعم OpenClaw أسلوبين من “snapshot”:

- **AI snapshot (refs رقمية)**: ‏`openclaw browser snapshot` (الافتراضي؛ `--format ai`)
  - الخرج: snapshot نصية تتضمن refs رقمية.
  - الإجراءات: `openclaw browser click 12`، و`openclaw browser type 23 "hello"`.
  - داخليًا، يتم حل ref عبر `aria-ref` في Playwright.

- **Role snapshot (role refs مثل `e12`)**: ‏`openclaw browser snapshot --interactive` (أو `--compact` أو `--depth` أو `--selector` أو `--frame`)
  - الخرج: قائمة/شجرة قائمة على الأدوار مع `[ref=e12]` (و`[nth=1]` اختياريًا).
  - الإجراءات: `openclaw browser click e12`، و`openclaw browser highlight e12`.
  - داخليًا، يتم حل ref عبر `getByRole(...)` (بالإضافة إلى `nth()` للتكرارات).
  - أضف `--labels` لتضمين لقطة شاشة لمنفذ العرض مع تسميات `e12` متراكبة.

سلوك ref:

- لا تكون refs **مستقرة عبر التنقلات**؛ وإذا فشل شيء، فأعد تشغيل `snapshot` واستخدم ref جديدة.
- إذا تم التقاط role snapshot باستخدام `--frame`، فسيتم تحديد role refs ضمن ذلك iframe حتى role snapshot التالية.

## إمكانات إضافية لـ Wait

يمكنك الانتظار على أكثر من مجرد الوقت/النص:

- الانتظار لعنوان URL (مع دعم globs من Playwright):
  - `openclaw browser wait --url "**/dash"`
- الانتظار لحالة التحميل:
  - `openclaw browser wait --load networkidle`
- الانتظار لمحمول JS منطقي:
  - `openclaw browser wait --fn "window.ready===true"`
- الانتظار حتى يصبح selector مرئيًا:
  - `openclaw browser wait "#main"`

يمكن دمج هذه الخيارات:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## تدفقات عمل التصحيح

عندما يفشل إجراء (مثل “not visible” أو “strict mode violation” أو “covered”):

1. `openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` (وفضّل role refs في الوضع interactive)
3. إذا استمر الفشل: استخدم `openclaw browser highlight <ref>` لترى ما الذي تستهدفه Playwright
4. إذا كانت الصفحة تتصرف بشكل غريب:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. للتصحيح العميق: سجّل trace:
   - `openclaw browser trace start`
   - أعد إنتاج المشكلة
   - `openclaw browser trace stop` (يطبع `TRACE:<path>`)

## خرج JSON

يُستخدم `--json` للبرمجة النصية والأدوات البنيوية.

أمثلة:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

تتضمن Role snapshots في JSON قيم `refs` بالإضافة إلى كتلة `stats` صغيرة (lines/chars/refs/interactive) بحيث يمكن للأدوات الاستدلال على حجم الحمولة وكثافتها.

## مفاتيح الحالة والبيئة

هذه مفيدة لعمليات “اجعل الموقع يتصرف مثل X”:

- ملفات تعريف الارتباط: `cookies` و`cookies set` و`cookies clear`
- التخزين: `storage local|session get|set|clear`
- عدم الاتصال: `set offline on|off`
- الترويسات: `set headers --headers-json '{"X-Debug":"1"}'` (ولا يزال `set headers --json '{"X-Debug":"1"}'` القديم مدعومًا)
- تفويض HTTP الأساسي: `set credentials user pass` (أو `--clear`)
- تحديد الموقع الجغرافي: `set geo <lat> <lon> --origin "https://example.com"` (أو `--clear`)
- الوسائط: `set media dark|light|no-preference|none`
- المنطقة الزمنية / اللغة المحلية: `set timezone ...` و`set locale ...`
- الجهاز / منفذ العرض:
  - `set device "iPhone 14"` (إعدادات أجهزة Playwright المسبقة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف المتصفح الشخصي openclaw على جلسات مسجّل دخولها؛ تعامل معه على أنه حساس.
- ينفّذ `browser act kind=evaluate` / `openclaw browser evaluate` و`wait --fn`
  JavaScript عشوائيًا في سياق الصفحة. وقد يؤدي حقن Prompt إلى توجيه
  ذلك. عطّله باستخدام `browser.evaluateEnabled=false` إذا لم تكن بحاجة إليه.
- بالنسبة إلى تسجيلات الدخول وملاحظات مكافحة bot (مثل X/Twitter وغير ذلك)، راجع [تسجيل الدخول إلى المتصفح + النشر على X/Twitter](/ar/tools/browser-login).
- أبقِ Gateway/مضيف node خاصًا (loopback أو tailnet فقط).
- نقاط نهاية CDP البعيدة قوية؛ استخدم لها نفقًا واحمها.

مثال على الوضع الصارم (حظر الوجهات الخاصة/الداخلية افتراضيًا):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // سماح دقيق اختياري
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

بالنسبة إلى المشكلات الخاصة بـ Linux (خصوصًا snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

وبالنسبة إلى إعدادات WSL2 Gateway + Windows Chrome ذات المضيف المنقسم، راجع
[استكشاف أخطاء WSL2 + Windows + Chrome البعيد عبر CDP وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء تشغيل CDP مقابل حظر التنقل بسبب SSRF

هذه فئات فشل مختلفة وتشير إلى مسارات شيفرة مختلفة.

- **فشل بدء التشغيل أو الجاهزية لـ CDP** يعني أن OpenClaw لا يستطيع التأكد من أن مستوى التحكم في المتصفح سليم.
- **حظر التنقل بسبب SSRF** يعني أن مستوى التحكم في المتصفح سليم، لكن هدف تنقل الصفحة مرفوض بسبب السياسة.

أمثلة شائعة:

- فشل بدء التشغيل أو الجاهزية لـ CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- حظر التنقل بسبب SSRF:
  - تفشل تدفقات `open` أو `navigate` أو snapshot أو فتح علامات التبويب مع خطأ في سياسة المتصفح/الشبكة بينما يظل `start` و`tabs` يعملان

استخدم هذا التسلسل المختصر للفصل بين الاثنين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشل `start` برسالة `not reachable after start`، فابدأ باستكشاف جاهزية CDP وإصلاحها.
- إذا نجح `start` ولكن فشل `tabs`، فلا يزال مستوى التحكم غير سليم. تعامل مع هذا على أنه مشكلة في الوصول إلى CDP، وليس مشكلة في تنقل الصفحة.
- إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فهذا يعني أن مستوى التحكم في المتصفح يعمل وأن الفشل في سياسة التنقل أو في الصفحة المستهدفة.
- إذا نجح `start` و`tabs` و`open` جميعًا، فهذا يعني أن مسار التحكم الأساسي في المتصفح المُدار سليم.

تفاصيل سلوكية مهمة:

- تفترض إعدادات المتصفح كائن سياسة SSRF مغلقًا عند الفشل افتراضيًا حتى عندما لا تقوم بإعداد `browser.ssrfPolicy`.
- بالنسبة إلى ملف `openclaw` المُدار على local loopback، تتجاوز فحوص صحة CDP عمدًا فرض الوصول وفق SSRF الخاص بمستوى التحكم المحلي في OpenClaw نفسه.
- تكون حماية التنقل منفصلة. ولا يعني نجاح `start` أو `tabs` أن هدف `open` أو `navigate` اللاحق مسموح به.

إرشادات الأمان:

- **لا** تقم بتخفيف سياسة SSRF الخاصة بالمتصفح افتراضيًا.
- فضّل استثناءات مضيقة للمضيف مثل `hostnameAllowlist` أو `allowedHostnames` بدلًا من السماح الواسع بالوصول إلى الشبكات الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في البيئات الموثوقة عمدًا حيث يكون الوصول إلى الشبكات الخاصة عبر المتصفح مطلوبًا ومراجعًا.

مثال: التنقل محظور ومستوى التحكم سليم

- ينجح `start`
- ينجح `tabs`
- يفشل `open http://internal.example`

يعني هذا عادةً أن بدء تشغيل المتصفح سليم وأن هدف التنقل يحتاج إلى مراجعة للسياسة.

مثال: بدء التشغيل محظور قبل أن يصبح التنقل مهمًا

- يفشل `start` مع `not reachable after start`
- يفشل `tabs` أيضًا أو لا يمكن تشغيله

يشير هذا إلى إطلاق المتصفح أو الوصول إلى CDP، وليس إلى مشكلة في قائمة سماح URL للصفحة.

## أدوات الوكيل + كيف يعمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` — الحالة/البدء/الإيقاف/علامات التبويب/الفتح/التركيز/الإغلاق/snapshot/لقطة الشاشة/navigate/act

كيف يتم الربط:

- يعيد `browser snapshot` شجرة واجهة مستخدم مستقرة (AI أو ARIA).
- يستخدم `browser act` معرّفات `ref` الخاصة بـ snapshot من أجل النقر/الكتابة/السحب/التحديد.
- يلتقط `browser screenshot` وحدات البكسل (الصفحة كاملة أو عنصرًا معينًا).
- يقبل `browser` ما يلي:
  - `profile` لاختيار ملف تعريف متصفح مسمى (openclaw، أو chrome، أو CDP بعيد).
  - `target` (`sandbox` | `host` | `node`) لاختيار مكان وجود المتصفح.
  - في الجلسات المعزولة، يتطلب `target: "host"` القيمة `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا تم حذف `target`: فإن الجلسات المعزولة تفترض `sandbox` افتراضيًا، بينما تفترض الجلسات غير المعزولة `host`.
  - إذا كانت هناك node تدعم المتصفح متصلة، فقد تقوم الأداة بتوجيه الطلب إليها تلقائيًا ما لم تثبت `target="host"` أو `target="node"`.

يحافظ هذا على حتمية الوكيل ويتجنب المحددات الهشة.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [Sandboxing](/ar/gateway/sandboxing) — التحكم في المتصفح داخل البيئات المعزولة
- [الأمان](/ar/gateway/security) — مخاطر التحكم في المتصفح وتقويته
