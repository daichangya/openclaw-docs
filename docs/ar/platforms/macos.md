---
read_when:
    - تنفيذ ميزات تطبيق macOS
    - تغيير دورة حياة Gateway أو ربط Node على macOS
summary: تطبيق OpenClaw المرافق لنظام macOS (شريط القوائم + وسيط Gateway)
title: تطبيق macOS
x-i18n:
    generated_at: "2026-04-18T07:14:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: d637df2f73ced110223c48ea3c934045d782e150a46495f434cf924a6a00baf0
    source_path: platforms/macos.md
    workflow: 15
---

# تطبيق OpenClaw المرافق لنظام macOS (شريط القوائم + وسيط Gateway)

تطبيق macOS هو **التطبيق المرافق في شريط القوائم** لـ OpenClaw. وهو يتولى الأذونات،
ويدير/يرتبط بـ Gateway محليًا (launchd أو يدويًا)، ويعرض إمكانات macOS
للوكيل كعقدة.

## ما الذي يفعله

- يعرض الإشعارات الأصلية والحالة في شريط القوائم.
- يتولى مطالبات TCC ‏(الإشعارات، تسهيلات الاستخدام، تسجيل الشاشة، الميكروفون،
  التعرّف على الكلام، الأتمتة/AppleScript).
- يشغّل Gateway أو يتصل به (محليًا أو عن بُعد).
- يعرّض أدوات macOS فقط ‏(Canvas، الكاميرا، تسجيل الشاشة، `system.run`).
- يبدأ خدمة استضافة العقدة المحلية في وضع **remote** ‏(launchd)، ويوقفها في وضع **local**.
- يمكنه اختياريًا استضافة **PeekabooBridge** لأتمتة واجهة المستخدم.
- يثبّت CLI العام (`openclaw`) عند الطلب عبر npm أو pnpm أو bun (يفضّل التطبيق npm، ثم pnpm، ثم bun؛ ويظل Node بيئة تشغيل Gateway الموصى بها).

## وضع local مقابل remote

- **Local** ‏(الافتراضي): يرتبط التطبيق بـ Gateway محلي قيد التشغيل إذا كان موجودًا؛
  وإلا فإنه يفعّل خدمة launchd عبر `openclaw gateway install`.
- **Remote**: يتصل التطبيق بـ Gateway عبر SSH/Tailscale ولا يبدأ أبدًا
  عملية محلية.
  يبدأ التطبيق **خدمة استضافة العقدة** المحلية حتى يتمكن Gateway البعيد من الوصول إلى هذا الـ Mac.
  لا يشغّل التطبيق Gateway كعملية فرعية.
  يفضّل اكتشاف Gateway الآن أسماء Tailscale MagicDNS بدلًا من عناوين tailnet IP الخام،
  لذا يستعيد تطبيق Mac عمله بشكل أكثر موثوقية عند تغيّر عناوين tailnet IP.

## التحكم في Launchd

يدير التطبيق LaunchAgent لكل مستخدم يحمل التسمية `ai.openclaw.gateway`
(أو `ai.openclaw.<profile>` عند استخدام `--profile`/`OPENCLAW_PROFILE`؛ ولا يزال `com.openclaw.*` القديم يُفرَّغ).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

استبدل التسمية بـ `ai.openclaw.<profile>` عند تشغيل ملف تعريف مُسمّى.

إذا لم يكن LaunchAgent مثبتًا، فقم بتمكينه من التطبيق أو شغّل
`openclaw gateway install`.

## إمكانات Node ‏(mac)

يقدّم تطبيق macOS نفسه كعقدة. الأوامر الشائعة:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- الكاميرا: `camera.snap`, `camera.clip`
- الشاشة: `screen.snapshot`, `screen.record`
- النظام: `system.run`, `system.notify`

تبلّغ العقدة عن خريطة `permissions` حتى تتمكن الوكلاء من تحديد المسموح به.

خدمة Node + ‏IPC للتطبيق:

- عند تشغيل خدمة استضافة العقدة بدون واجهة (وضع remote)، فإنها تتصل بـ Gateway WS كعقدة.
- يُنفَّذ `system.run` في تطبيق macOS ‏(سياق UI/TCC) عبر مقبس Unix محلي؛ وتبقى المطالبات والمخرجات داخل التطبيق.

المخطط (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## موافقات التنفيذ (`system.run`)

يخضع `system.run` إلى **Exec approvals** في تطبيق macOS ‏(الإعدادات ← Exec approvals).
ويتم تخزين الأمان + السؤال + قائمة السماح محليًا على جهاز Mac في:

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

- إدخالات `allowlist` هي أنماط glob لمسارات الملفات الثنائية المحلولة.
- يُعامل نص أمر shell الخام الذي يحتوي على صيغة تحكم أو توسيع shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) على أنه عدم تطابق مع قائمة السماح ويتطلب موافقة صريحة (أو إضافة الملف الثنائي الخاص بالـ shell إلى قائمة السماح).
- يؤدي اختيار “السماح دائمًا” في المطالبة إلى إضافة ذلك الأمر إلى قائمة السماح.
- تُرشَّح تجاوزات البيئة الخاصة بـ `system.run` ‏(مع إسقاط `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) ثم تُدمج مع بيئة التطبيق.
- بالنسبة إلى أغلفة shell ‏(`bash|sh|zsh ... -c/-lc`)، تُختزل تجاوزات البيئة على مستوى الطلب إلى قائمة سماح صريحة صغيرة (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- بالنسبة إلى قرارات السماح الدائم في وضع قائمة السماح، فإن مغلفات التوجيه المعروفة (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) تحفظ مسارات الملفات التنفيذية الداخلية بدلًا من مسارات المغلفات. وإذا لم يكن فكّ التغليف آمنًا، فلن يتم حفظ أي إدخال في قائمة السماح تلقائيًا.

## الروابط العميقة

يسجل التطبيق مخطط URL ‏`openclaw://` للإجراءات المحلية.

### `openclaw://agent`

يحفّز طلب `agent` إلى Gateway.
__OC_I18N_900004__
معلمات الاستعلام:

- `message` ‏(مطلوب)
- `sessionKey` ‏(اختياري)
- `thinking` ‏(اختياري)
- `deliver` / `to` / `channel` ‏(اختياري)
- `timeoutSeconds` ‏(اختياري)
- `key` ‏(اختياري، مفتاح وضع التشغيل غير المراقب)

الأمان:

- بدون `key`، يطلب التطبيق التأكيد.
- بدون `key`، يفرض التطبيق حدًا قصيرًا لطول الرسالة في مطالبة التأكيد ويتجاهل `deliver` / `to` / `channel`.
- مع `key` صالح، يكون التشغيل غير مراقب (وهو مخصّص للأتمتة الشخصية).

## تدفق الإعداد الأولي (نموذجي)

1. ثبّت **OpenClaw.app** وشغّله.
2. أكمل قائمة التحقق من الأذونات (مطالبات TCC).
3. تأكد من أن وضع **Local** نشط وأن Gateway قيد التشغيل.
4. ثبّت CLI إذا كنت تريد الوصول عبر الطرفية.

## موضع دليل الحالة (macOS)

تجنب وضع دليل حالة OpenClaw في iCloud أو أي مجلدات أخرى متزامنة عبر السحابة.
قد تضيف المسارات المدعومة بالمزامنة زمن انتقال، وقد تتسبب أحيانًا في سباقات قفل الملفات/المزامنة
للجلسات وبيانات الاعتماد.

يفضَّل استخدام مسار حالة محلي غير متزامن مثل:
__OC_I18N_900005__
إذا اكتشف `openclaw doctor` حالة ضمن:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

فسوف يعرض تحذيرًا ويوصي بالعودة إلى مسار محلي.

## سير عمل البناء والتطوير (أصلي)

- `cd apps/macos && swift build`
- `swift run OpenClaw` ‏(أو Xcode)
- تحزيم التطبيق: `scripts/package-mac-app.sh`

## تصحيح اتصال gateway ‏(CLI على macOS)

استخدم CLI الخاص بالتصحيح لاختبار المنطق نفسه الخاص بمصافحة Gateway WebSocket والاكتشاف
الذي يستخدمه تطبيق macOS، من دون تشغيل التطبيق.
__OC_I18N_900006__
خيارات الاتصال:

- `--url <ws://host:port>`: تجاوز الإعدادات
- `--mode <local|remote>`: الحل من الإعدادات (الافتراضي: الإعدادات أو local)
- `--probe`: فرض فحص سلامة جديد
- `--timeout <ms>`: مهلة الطلب (الافتراضي: `15000`)
- `--json`: مخرجات منظَّمة للمقارنة

خيارات الاكتشاف:

- `--include-local`: تضمين Gateways التي كانت ستُصفّى باعتبارها “محلية”
- `--timeout <ms>`: نافذة الاكتشاف الإجمالية (الافتراضي: `2000`)
- `--json`: مخرجات منظَّمة للمقارنة

نصيحة: قارن مع `openclaw gateway discover --json` لمعرفة ما إذا كان
مسار اكتشاف تطبيق macOS ‏(`local.` بالإضافة إلى النطاق الواسع المُعدّ، مع
بدائل wide-area وTailscale Serve) يختلف عن
اكتشاف CLI الخاص بـ Node المعتمد على `dns-sd`.

## البنية الداخلية للاتصال البعيد (أنفاق SSH)

عندما يعمل تطبيق macOS في وضع **Remote**، فإنه يفتح نفق SSH حتى تتمكن مكونات واجهة المستخدم المحلية
من التحدث إلى Gateway بعيد كما لو كان على localhost.

### نفق التحكم (منفذ Gateway WebSocket)

- **الغرض:** فحوصات السلامة، الحالة، Web Chat، الإعدادات، واستدعاءات مستوى التحكم الأخرى.
- **المنفذ المحلي:** منفذ Gateway ‏(الافتراضي `18789`) وهو ثابت دائمًا.
- **المنفذ البعيد:** منفذ Gateway نفسه على المضيف البعيد.
- **السلوك:** لا يوجد منفذ محلي عشوائي؛ يعيد التطبيق استخدام نفق سليم موجود
  أو يعيد تشغيله إذا لزم الأمر.
- **صيغة SSH:** ‏`ssh -N -L <local>:127.0.0.1:<remote>` مع خيارات BatchMode +
  ExitOnForwardFailure + keepalive.
- **الإبلاغ عن IP:** يستخدم نفق SSH عنوان loopback، لذلك سيرى الـ gateway عنوان IP
  الخاص بالعقدة على أنه `127.0.0.1`. استخدم نقل **Direct (ws/wss)** إذا كنت تريد ظهور
  عنوان IP الحقيقي للعميل (راجع [الوصول البعيد على macOS](/ar/platforms/mac/remote)).

لخطوات الإعداد، راجع [الوصول البعيد على macOS](/ar/platforms/mac/remote). ولتفاصيل
البروتوكول، راجع [بروتوكول Gateway](/ar/gateway/protocol).

## المستندات ذات الصلة

- [دليل تشغيل Gateway](/ar/gateway)
- [Gateway ‏(macOS)](/ar/platforms/mac/bundled-gateway)
- [أذونات macOS](/ar/platforms/mac/permissions)
- [Canvas](/ar/platforms/mac/canvas)
