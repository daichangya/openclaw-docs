---
read_when:
    - البرمجة النصية أو تصحيح أخطاء متصفح الوكيل عبر واجهة API المحلية للتحكم
    - تبحث عن مرجع CLI لـ `openclaw browser`
    - إضافة أتمتة متصفح مخصصة باستخدام اللقطات والمراجع
summary: واجهة OpenClaw API للتحكم بالمتصفح، ومرجع CLI، وإجراءات البرمجة النصية
title: واجهة API للتحكم بالمتصفح
x-i18n:
    generated_at: "2026-04-25T13:59:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1515ca1e31e6fd8fd3e0f34f17ce309c52202e26ed3b79e24a460380efab040d
    source_path: tools/browser-control.md
    workflow: 15
---

بالنسبة إلى الإعداد، والتكوين، واستكشاف الأخطاء وإصلاحها، راجع [المتصفح](/ar/tools/browser).
هذه الصفحة هي المرجع الخاص بواجهة HTTP API المحلية للتحكم، وCLI ‏`openclaw browser`،
وأنماط البرمجة النصية (اللقطات، والمراجع، وعمليات الانتظار، وتدفقات التصحيح).

## واجهة API للتحكم (اختيارية)

بالنسبة إلى التكاملات المحلية فقط، يعرض Gateway واجهة HTTP API صغيرة عبر loopback:

- الحالة/البدء/الإيقاف: `GET /`، و`POST /start`، و`POST /stop`
- علامات التبويب: `GET /tabs`، و`POST /tabs/open`، و`POST /tabs/focus`، و`DELETE /tabs/:targetId`
- اللقطة/لقطة الشاشة: `GET /snapshot`، و`POST /screenshot`
- الإجراءات: `POST /navigate`، و`POST /act`
- الخطافات: `POST /hooks/file-chooser`، و`POST /hooks/dialog`
- التنزيلات: `POST /download`، و`POST /wait/download`
- التصحيح: `GET /console`، و`POST /pdf`
- التصحيح: `GET /errors`، و`GET /requests`، و`POST /trace/start`، و`POST /trace/stop`، و`POST /highlight`
- الشبكة: `POST /response/body`
- الحالة: `GET /cookies`، و`POST /cookies/set`، و`POST /cookies/clear`
- الحالة: `GET /storage/:kind`، و`POST /storage/:kind/set`، و`POST /storage/:kind/clear`
- الإعدادات: `POST /set/offline`، و`POST /set/headers`، و`POST /set/credentials`، و`POST /set/geolocation`، و`POST /set/media`، و`POST /set/timezone`، و`POST /set/locale`، و`POST /set/device`

تقبل جميع نقاط النهاية `?profile=<name>`. ويطلب `POST /start?headless=true`
تشغيلًا headless لمرة واحدة لملفات التعريف المحلية المُدارة من دون تغيير
إعدادات المتصفح المحفوظة؛ بينما ترفض ملفات تعريف attach-only وCDP البعيد والجلسات الموجودة
ذلك التجاوز لأن OpenClaw لا يشغّل عمليات تلك المتصفحات.

إذا كانت مصادقة gateway بسر مشترك مضبوطة، فإن مسارات HTTP الخاصة بالمتصفح تتطلب المصادقة أيضًا:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو HTTP Basic auth باستخدام كلمة المرور هذه

ملاحظات:

- لا تستهلك واجهة API هذه المستقلة للمتصفح عبر loopback رؤوس الهوية الخاصة بـ trusted-proxy أو
  Tailscale Serve.
- إذا كان `gateway.auth.mode` هو `none` أو `trusted-proxy`، فإن مسارات المتصفح
  هذه عبر loopback لا ترث أوضاع الهوية هذه؛ فأبقِها محصورة في loopback فقط.

### عقد الأخطاء في `/act`

يستخدم `POST /act` استجابة خطأ منظَّمة للتحقق على مستوى المسار
ولإخفاقات السياسة:

```json
{ "error": "<message>", "code": "ACT_*" }
```

قيم `code` الحالية:

- `ACT_KIND_REQUIRED` ‏(HTTP 400): `kind` مفقود أو غير معروف.
- `ACT_INVALID_REQUEST` ‏(HTTP 400): فشل تطبيع حمولة الإجراء أو التحقق منها.
- `ACT_SELECTOR_UNSUPPORTED` ‏(HTTP 400): استُخدم `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` ‏(HTTP 403): تم تعطيل `evaluate` (أو `wait --fn`) عبر الإعدادات.
- `ACT_TARGET_ID_MISMATCH` ‏(HTTP 403): يتعارض `targetId` على المستوى الأعلى أو داخل الحزمة مع هدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` ‏(HTTP 501): الإجراء غير مدعوم لملفات تعريف existing-session.

قد لا تزال إخفاقات وقت التشغيل الأخرى تُرجع `{ "error": "<message>" }` من دون
حقل `code`.

### متطلب Playwright

تتطلب بعض الميزات (navigate/act/AI snapshot/role snapshot، ولقطات العناصر،
وPDF) وجود Playwright. وإذا لم يكن Playwright مثبتًا، فإن نقاط النهاية تلك تعيد
خطأ 501 واضحًا.

ما الذي لا يزال يعمل من دون Playwright:

- لقطات ARIA
- لقطات الصفحة الخاصة بالمتصفح المُدار `openclaw` عندما يكون WebSocket
  خاص بكل علامة تبويب متاحًا
- لقطات الصفحة لملفات تعريف `existing-session` / Chrome MCP
- لقطات الشاشة المعتمدة على المرجع `existing-session` (`--ref`) من مخرجات snapshot

ما الذي لا يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- لقطات العناصر بمحدد CSS (`--element`)
- تصدير PDF الكامل للمتصفح

كما ترفض لقطات العناصر أيضًا الخيار `--full-page`؛ إذ يعيد المسار الرسالة `fullPage is
not supported for element screenshots`.

إذا رأيت الرسالة `Playwright is not available in this gateway build`، فأصلح
تبعيات وقت تشغيل Plugin المتصفح المضمّنة حتى يتم تثبيت `playwright-core`،
ثم أعد تشغيل gateway. وبالنسبة إلى عمليات التثبيت المعبأة، شغّل `openclaw doctor --fix`.
أما في Docker، فثبّت أيضًا ثنائيات متصفح Chromium كما هو موضح أدناه.

#### تثبيت Playwright في Docker

إذا كان Gateway يعمل في Docker، فتجنب `npx playwright` (تعارضات npm override).
استخدم CLI المضمّن بدلًا من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

وللاحتفاظ بتنزيلات المتصفح، اضبط `PLAYWRIGHT_BROWSERS_PATH` (على سبيل المثال،
`/home/node/.cache/ms-playwright`) وتأكد من استمرار `/home/node` عبر
`OPENCLAW_HOME_VOLUME` أو bind mount. راجع [Docker](/ar/install/docker).

## كيف يعمل (داخليًا)

يقبل خادم تحكم صغير عبر loopback طلبات HTTP ويتصل بالمتصفحات المستندة إلى Chromium عبر CDP. وتذهب الإجراءات المتقدمة (click/type/snapshot/PDF) عبر Playwright فوق CDP؛ وعندما يكون Playwright مفقودًا، لا تتوفر إلا العمليات غير المعتمدة على Playwright. ويرى الوكيل واجهة واحدة ثابتة بينما تتبدل المتصفحات والملفات الشخصية المحلية/البعيدة بحرية في الأسفل.

## مرجع CLI سريع

تقبل جميع الأوامر `--browser-profile <name>` لاستهداف ملف تعريف محدد، و`--json` للحصول على مخرجات قابلة للقراءة آليًا.

<AccordionGroup>

<Accordion title="الأساسيات: الحالة، وعلامات التبويب، والفتح/التركيز/الإغلاق">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="الفحص: لقطة الشاشة، واللقطة، ووحدة التحكم، والأخطاء، والطلبات">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="الإجراءات: التنقل، والنقر، والكتابة، والسحب، والانتظار، والتقييم">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="الحالة: cookies، وstorage، وعدم الاتصال، والترويسات، والموقع الجغرافي، والجهاز">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

ملاحظات:

- `upload` و`dialog` هما استدعاءان **للتسليح**؛ شغّلهما قبل النقر/الضغط الذي يطلق منتقي الملفات/مربع الحوار.
- تتطلب `click`/`type`/إلخ قيمة `ref` من `snapshot` (رقمي `12`، أو مرجع دور `e12`، أو مرجع ARIA قابل للتنفيذ `ax12`). ولا تُدعَم محددات CSS عمدًا في الإجراءات. استخدم `click-coords` عندما يكون موضع viewport المرئي هو الهدف الموثوق الوحيد.
- تُقيَّد مسارات التنزيل، والتتبع، والرفع بجذور temp الخاصة بـ OpenClaw: ‏`/tmp/openclaw{,/downloads,/uploads}` (والرجوع الاحتياطي: `${os.tmpdir()}/openclaw/...`).
- يمكن لـ `upload` أيضًا ضبط مدخلات الملفات مباشرة عبر `--input-ref` أو `--element`.

أهم رايات snapshot باختصار:

- `--format ai` (الافتراضي مع Playwright): AI snapshot مع مراجع رقمية (`aria-ref="<n>"`).
- `--format aria`: شجرة إمكانية الوصول مع مراجع `axN`. وعندما يكون Playwright متاحًا، يربط OpenClaw المراجع بمعرّفات DOM الخلفية إلى الصفحة الحية بحيث يمكن للإجراءات اللاحقة استخدامها؛ وإلا فتعامل مع المخرجات على أنها للفحص فقط.
- `--efficient` (أو `--mode efficient`): إعداد role snapshot مضغوط مسبقًا. اضبط `browser.snapshotDefaults.mode: "efficient"` لجعله الافتراضي (راجع [إعدادات Gateway](/ar/gateway/configuration-reference#browser)).
- تفرض `--interactive`، و`--compact`، و`--depth`، و`--selector` role snapshot مع مراجع `ref=e12`. ويقيّد `--frame "<iframe>"` role snapshots إلى iframe.
- يضيف `--labels` لقطة شاشة viewport فقط مع تسميات مرجعية فوقية (ويطبع `MEDIA:<path>`).
- تضيف `--urls` وجهات الروابط المكتشفة إلى AI snapshots.

## اللقطات والمراجع

يدعم OpenClaw نمطين من “اللقطات”:

- **AI snapshot (مراجع رقمية)**: ‏`openclaw browser snapshot` (الافتراضي؛ `--format ai`)
  - المخرجات: لقطة نصية تتضمن مراجع رقمية.
  - الإجراءات: `openclaw browser click 12`، و`openclaw browser type 23 "hello"`.
  - داخليًا، يُحل المرجع عبر `aria-ref` الخاص بـ Playwright.

- **Role snapshot (مراجع أدوار مثل `e12`)**: ‏`openclaw browser snapshot --interactive` (أو `--compact`، أو `--depth`، أو `--selector`، أو `--frame`)
  - المخرجات: قائمة/شجرة معتمدة على الدور تحتوي على `[ref=e12]` (و`[nth=1]` اختياريًا).
  - الإجراءات: `openclaw browser click e12`، و`openclaw browser highlight e12`.
  - داخليًا، يُحل المرجع عبر `getByRole(...)` (بالإضافة إلى `nth()` عند التكرار).
  - أضف `--labels` لتضمين لقطة شاشة viewport مع تسميات `e12` فوقية.
  - أضف `--urls` عندما يكون نص الرابط ملتبسًا ويحتاج الوكيل إلى
    أهداف تنقل واضحة.

- **ARIA snapshot (مراجع ARIA مثل `ax12`)**: ‏`openclaw browser snapshot --format aria`
  - المخرجات: شجرة إمكانية الوصول كعُقد منظَّمة.
  - الإجراءات: يعمل `openclaw browser click ax12` عندما يتمكن مسار اللقطة من ربط
    المرجع عبر Playwright ومعرّفات Chrome backend DOM.
  - إذا لم يكن Playwright متاحًا، يمكن أن تظل لقطات ARIA مفيدة
    للفحص، لكن المراجع قد لا تكون قابلة للتنفيذ. أعد أخذ لقطة باستخدام `--format ai`
    أو `--interactive` عندما تحتاج إلى مراجع قابلة للتنفيذ.

سلوك المراجع:

- المراجع **ليست ثابتة عبر التنقلات**؛ وإذا فشل شيء ما، فأعد تشغيل `snapshot` واستخدم مرجعًا جديدًا.
- إذا أُخذت role snapshot باستخدام `--frame`، فإن مراجع الدور تبقى مقيّدة بذلك iframe حتى role snapshot التالية.
- تفشل مراجع `axN` غير المعروفة أو القديمة بسرعة بدلًا من أن تنتقل تلقائيًا إلى
  محدد `aria-ref` الخاص بـ Playwright. وعندما يحدث ذلك، شغّل لقطة جديدة على علامة التبويب نفسها.

## تحسينات الانتظار

يمكنك الانتظار على أكثر من مجرد الوقت/النص:

- الانتظار حتى عنوان URL (مع دعم globs من Playwright):
  - `openclaw browser wait --url "**/dash"`
- الانتظار حتى حالة التحميل:
  - `openclaw browser wait --load networkidle`
- الانتظار حتى تعبير JS:
  - `openclaw browser wait --fn "window.ready===true"`
- الانتظار حتى يصبح محدد ما مرئيًا:
  - `openclaw browser wait "#main"`

يمكن جمع هذه العناصر معًا:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## تدفقات التصحيح

عندما يفشل إجراء ما (مثل “not visible”، أو “strict mode violation”، أو “covered”):

1. ‏`openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` (وفضّل مراجع الأدوار في الوضع التفاعلي)
3. إذا استمر الفشل: استخدم `openclaw browser highlight <ref>` لمعرفة ما الذي يستهدفه Playwright
4. إذا تصرفت الصفحة بشكل غريب:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. للتصحيح العميق: سجّل trace:
   - `openclaw browser trace start`
   - أعد إنتاج المشكلة
   - `openclaw browser trace stop` (يطبع `TRACE:<path>`)

## مخرجات JSON

يُستخدم `--json` للبرمجة النصية والأدوات المنظَّمة.

أمثلة:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

تتضمن role snapshots في JSON كائن `refs` بالإضافة إلى كتلة `stats` صغيرة (lines/chars/refs/interactive) حتى تتمكن الأدوات من فهم حجم الحمولة وكثافتها.

## مفاتيح الحالة والبيئة

هذه مفيدة في تدفقات “اجعل الموقع يتصرف مثل X”:

- Cookies: ‏`cookies`، و`cookies set`، و`cookies clear`
- Storage: ‏`storage local|session get|set|clear`
- عدم الاتصال: `set offline on|off`
- الترويسات: `set headers --headers-json '{"X-Debug":"1"}'` (ولا يزال الشكل القديم `set headers --json '{"X-Debug":"1"}'` مدعومًا)
- مصادقة HTTP الأساسية: `set credentials user pass` (أو `--clear`)
- الموقع الجغرافي: `set geo <lat> <lon> --origin "https://example.com"` (أو `--clear`)
- الوسائط: `set media dark|light|no-preference|none`
- المنطقة الزمنية / اللغة المحلية: `set timezone ...`، و`set locale ...`
- الجهاز / viewport:
  - `set device "iPhone 14"` (إعدادات أجهزة Playwright المسبقة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف تعريف متصفح openclaw على جلسات مسجّل دخول فيها؛ لذا تعامل معه على أنه حساس.
- يقوم `browser act kind=evaluate` / `openclaw browser evaluate` و`wait --fn`
  بتنفيذ JavaScript اعتباطي في سياق الصفحة. ويمكن لحقن المطالبات أن يوجه
  هذا السلوك. عطّله عبر `browser.evaluateEnabled=false` إذا لم تكن بحاجة إليه.
- بالنسبة إلى تسجيلات الدخول وملاحظات مكافحة الروبوتات (X/Twitter، إلخ)، راجع [تسجيل الدخول في المتصفح + النشر على X/Twitter](/ar/tools/browser-login).
- أبقِ Gateway/مضيف العقدة خاصًا (loopback أو tailnet-only).
- إن نقاط نهاية CDP البعيدة قوية؛ فقم بتمريرها عبر نفق واحمِها.

مثال للوضع الصارم (حظر الوجهات الخاصة/الداخلية افتراضيًا):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## ذو صلة

- [المتصفح](/ar/tools/browser) — نظرة عامة، والإعدادات، وملفات التعريف، والأمان
- [تسجيل الدخول في المتصفح](/ar/tools/browser-login) — تسجيل الدخول إلى المواقع
- [استكشاف أخطاء المتصفح في Linux وإصلاحها](/ar/tools/browser-linux-troubleshooting)
- [استكشاف أخطاء المتصفح في WSL2 وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
