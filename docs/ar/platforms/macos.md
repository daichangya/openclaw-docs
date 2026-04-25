---
read_when:
    - تنفيذ ميزات تطبيق macOS
    - تغيير دورة حياة Gateway أو جسر العُقد على macOS
summary: تطبيق OpenClaw المرافق على macOS (شريط القوائم + وسيط Gateway)
title: تطبيق macOS
x-i18n:
    generated_at: "2026-04-25T13:51:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 852c93694ebb4ac083b9a44c2e4d6e40274e6e7f3aa6fa664a8eba1a82aaf5b1
    source_path: platforms/macos.md
    workflow: 15
---

تطبيق macOS هو **الرفيق الموجود في شريط القوائم** لـ OpenClaw. وهو يملك الأذونات،
ويدير/يرتبط بـ Gateway محليًا (launchd أو يدويًا)، ويعرض إمكانات macOS
للوكيل على شكل عقدة.

## ما الذي يفعله

- يعرض إشعارات أصلية وحالة في شريط القوائم.
- يملك مطالبات TCC (الإشعارات، وإمكانية الوصول، وتسجيل الشاشة، والميكروفون،
  والتعرف على الكلام، والأتمتة/AppleScript).
- يشغّل Gateway أو يتصل به (محلي أو بعيد).
- يعرض الأدوات الخاصة بـ macOS فقط (Canvas، والكاميرا، وتسجيل الشاشة، و`system.run`).
- يبدأ خدمة مضيف العقدة المحلية في الوضع **البعيد** (launchd)، ويوقفها في الوضع **المحلي**.
- يمكنه اختياريًا استضافة **PeekabooBridge** لأتمتة واجهة المستخدم.
- يثبّت CLI العام (`openclaw`) عند الطلب عبر npm أو pnpm أو bun (يفضّل التطبيق npm، ثم pnpm، ثم bun؛ ويظل Node هو وقت تشغيل Gateway الموصى به).

## الوضع المحلي مقابل الوضع البعيد

- **محلي** (الافتراضي): يرتبط التطبيق بـ Gateway محلي قيد التشغيل إذا كان موجودًا؛
  وإلا فإنه يفعّل خدمة launchd عبر `openclaw gateway install`.
- **بعيد**: يتصل التطبيق بـ Gateway عبر SSH/Tailscale ولا يبدأ
  عملية محلية مطلقًا.
  يبدأ التطبيق **خدمة مضيف العقدة** المحلية حتى يتمكن Gateway البعيد من الوصول إلى هذا الـ Mac.
  ولا يشغّل التطبيق Gateway كعملية فرعية.
  ويفضّل اكتشاف Gateway الآن أسماء Tailscale MagicDNS على عناوين tailnet IP الخام،
  لذلك يتعافى تطبيق Mac بشكل أكثر موثوقية عندما تتغير عناوين tailnet IP.

## التحكم في Launchd

يدير التطبيق LaunchAgent لكل مستخدم يحمل التسمية `ai.openclaw.gateway`
(أو `ai.openclaw.<profile>` عند استخدام `--profile`/`OPENCLAW_PROFILE`؛ ولا تزال التسمية القديمة `com.openclaw.*` قابلة للإلغاء).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

استبدل التسمية بـ `ai.openclaw.<profile>` عند تشغيل ملف شخصي مسمّى.

إذا لم يكن LaunchAgent مثبّتًا، ففعّله من التطبيق أو شغّل
`openclaw gateway install`.

## إمكانات العقدة (mac)

يعرض تطبيق macOS نفسه كعقدة. الأوامر الشائعة:

- Canvas: ‏`canvas.present`، و`canvas.navigate`، و`canvas.eval`، و`canvas.snapshot`، و`canvas.a2ui.*`
- الكاميرا: `camera.snap`، و`camera.clip`
- الشاشة: `screen.snapshot`، و`screen.record`
- النظام: `system.run`، و`system.notify`

وتبلغ العقدة عن خريطة `permissions` حتى تتمكن الوكلاء من تقرير المسموح به.

خدمة العقدة + IPC للتطبيق:

- عندما تكون خدمة مضيف العقدة عديمة الواجهة قيد التشغيل (الوضع البعيد)، فإنها تتصل بـ Gateway WS كعقدة.
- يتم تنفيذ `system.run` في تطبيق macOS (ضمن سياق UI/TCC) عبر Unix socket محلي؛ وتبقى المطالبات + المخرجات داخل التطبيق.

الرسم التخطيطي (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## موافقات Exec (`system.run`)

يخضع `system.run` إلى **موافقات Exec** في تطبيق macOS (الإعدادات ← موافقات Exec).
وتُخزَّن الأمان + الاستئذان + قائمة السماح محليًا على جهاز Mac في:

```
~/.openclaw/exec-approvals.json
```

مثال:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

ملاحظات:

- تكون إدخالات `allowlist` أنماط glob لمسارات الملفات التنفيذية المحلولة، أو أسماء أوامر مجردة للأوامر المستدعاة عبر PATH.
- يُعامَل نص أمر shell الخام الذي يحتوي على صياغة تحكم أو توسيع shell (`&&`، أو `||`، أو `;`، أو `|`، أو `` ` ``، أو `$`، أو `<`، أو `>`، أو `(`، أو `)`) على أنه إخفاق في قائمة السماح ويتطلب موافقة صريحة (أو إدراج الملف التنفيذي للـ shell في قائمة السماح).
- يؤدي اختيار “Always Allow” في المطالبة إلى إضافة ذلك الأمر إلى قائمة السماح.
- تتم تصفية تجاوزات البيئة في `system.run` (إسقاط `PATH`، و`DYLD_*`، و`LD_*`، و`NODE_OPTIONS`، و`PYTHON*`، و`PERL*`، و`RUBYOPT`، و`SHELLOPTS`، و`PS4`) ثم دمجها مع بيئة التطبيق.
- بالنسبة إلى أغلفة shell (`bash|sh|zsh ... -c/-lc`)، تُخفَّض تجاوزات البيئة ذات النطاق الخاص بالطلب إلى قائمة سماح صريحة صغيرة (`TERM`، و`LANG`، و`LC_*`، و`COLORTERM`، و`NO_COLOR`، و`FORCE_COLOR`).
- بالنسبة إلى قرارات السماح الدائم في وضع قائمة السماح، تحتفظ مغلفات الإرسال المعروفة (`env`، و`nice`، و`nohup`، و`stdbuf`، و`timeout`) بمسارات الملف التنفيذي الداخلي بدلًا من مسارات المغلف. وإذا لم يكن فك التغليف آمنًا، فلن يُحفَظ أي إدخال في قائمة السماح تلقائيًا.

## الروابط العميقة

يسجّل التطبيق مخطط URL ‏`openclaw://` للإجراءات المحلية.

### `openclaw://agent`

يُطلق طلب `agent` إلى Gateway.
__OC_I18N_900004__
معلمات الاستعلام:

- `message` (مطلوب)
- `sessionKey` (اختياري)
- `thinking` (اختياري)
- `deliver` / `to` / `channel` (اختياري)
- `timeoutSeconds` (اختياري)
- `key` (اختياري لوضع التشغيل غير المراقب)

الأمان:

- من دون `key`، يطلب التطبيق تأكيدًا.
- من دون `key`، يفرض التطبيق حدًا قصيرًا للرسالة في مطالبة التأكيد ويتجاهل `deliver` / `to` / `channel`.
- مع `key` صالح، يصبح التشغيل غير مراقب (ومقصودًا للأتمتات الشخصية).

## تدفق الإعداد الأولي (النموذجي)

1. ثبّت وشغّل **OpenClaw.app**.
2. أكمل قائمة التحقق من الأذونات (مطالبات TCC).
3. تأكد من أن الوضع **المحلي** نشط وأن Gateway يعمل.
4. ثبّت CLI إذا كنت تريد الوصول عبر الطرفية.

## موضع دليل الحالة (macOS)

تجنب وضع دليل حالة OpenClaw في iCloud أو غيره من المجلدات المتزامنة سحابيًا.
فالمسارات المعتمدة على المزامنة قد تضيف زمن تأخير وتتسبب أحيانًا في سباقات قفل/مزامنة للملفات من أجل
الجلسات وبيانات الاعتماد.

فضّل مسار حالة محليًا غير متزامن مثل:
__OC_I18N_900005__
إذا اكتشف `openclaw doctor` حالة تحت:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

فسيحذر ويوصي بالعودة إلى مسار محلي.

## سير عمل البناء والتطوير (أصلي)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (أو Xcode)
- حزم التطبيق: `scripts/package-mac-app.sh`

## تصحيح اتصال gateway (CLI على macOS)

استخدم CLI الخاص بالتصحيح لممارسة مصافحة WebSocket الخاصة بـ Gateway ومنطق الاكتشاف نفسه
اللذين يستخدمهما تطبيق macOS، من دون تشغيل التطبيق.
__OC_I18N_900006__
خيارات الاتصال:

- `--url <ws://host:port>`: تجاوز الإعدادات
- `--mode <local|remote>`: الحل من الإعدادات (الافتراضي: الإعدادات أو المحلي)
- `--probe`: فرض اختبار صحة جديد
- `--timeout <ms>`: مهلة الطلب (الافتراضي: `15000`)
- `--json`: مخرجات منظَّمة للمقارنة

خيارات الاكتشاف:

- `--include-local`: تضمين البوابات التي كانت ستُصفَّى على أنها “محلية”
- `--timeout <ms>`: نافذة الاكتشاف الكلية (الافتراضي: `2000`)
- `--json`: مخرجات منظَّمة للمقارنة

نصيحة: قارِن مع `openclaw gateway discover --json` لمعرفة ما إذا كان
مسار اكتشاف تطبيق macOS (`local.` بالإضافة إلى النطاق واسع النطاق المضبوط، مع
بدائل Wide-area وTailscale Serve) يختلف عن
اكتشاف `dns-sd` الخاص بـ Node CLI.

## البنية التحتية للاتصال البعيد (أنفاق SSH)

عندما يعمل تطبيق macOS في الوضع **البعيد**، فإنه يفتح نفق SSH حتى تتمكن مكونات واجهة المستخدم المحلية
من التحدث إلى Gateway بعيد كما لو كان على localhost.

### نفق التحكم (منفذ Gateway WebSocket)

- **الغرض:** فحوصات الصحة، والحالة، وWeb Chat، والإعدادات، واستدعاءات مستوى التحكم الأخرى.
- **المنفذ المحلي:** منفذ Gateway (الافتراضي `18789`)، وثابت دائمًا.
- **المنفذ البعيد:** منفذ Gateway نفسه على المضيف البعيد.
- **السلوك:** لا يوجد منفذ محلي عشوائي؛ إذ يعيد التطبيق استخدام نفق سليم موجود
  أو يعيد تشغيله إذا لزم الأمر.
- **شكل SSH:** ‏`ssh -N -L <local>:127.0.0.1:<remote>` مع BatchMode +
  ExitOnForwardFailure + خيارات keepalive.
- **الإبلاغ عن عنوان IP:** يستخدم نفق SSH قيمة loopback، لذلك سيرى gateway عنوان IP
  للعقدة على أنه `127.0.0.1`. استخدم النقل **المباشر (ws/wss)** إذا أردت
  ظهور عنوان IP الحقيقي للعميل (راجع [الوصول البعيد على macOS](/ar/platforms/mac/remote)).

للاطلاع على خطوات الإعداد، راجع [الوصول البعيد على macOS](/ar/platforms/mac/remote). وبالنسبة إلى تفاصيل البروتوكول،
راجع [بروتوكول Gateway](/ar/gateway/protocol).

## مستندات ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [Gateway (macOS)](/ar/platforms/mac/bundled-gateway)
- [أذونات macOS](/ar/platforms/mac/permissions)
- [Canvas](/ar/platforms/mac/canvas)
