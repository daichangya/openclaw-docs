---
read_when:
    - تشغيل إعدادات Gateway البعيدة أو استكشاف أخطائها وإصلاحها
summary: الوصول عن بُعد باستخدام أنفاق SSH ‏(Gateway WS) وtailnets
title: الوصول عن بُعد
x-i18n:
    generated_at: "2026-04-25T13:48:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91f53a1f6798f56b3752c96c01f6944c4b5e9ee649ae58975a2669a099203e40
    source_path: gateway/remote.md
    workflow: 15
---

يدعم هذا المستودع “الوصول البعيد عبر SSH” من خلال إبقاء Gateway واحدة (الأساسية) تعمل على مضيف مخصص (سطح مكتب/خادم) وربط العملاء بها.

- بالنسبة إلى **المشغّلين (أنت / تطبيق macOS)**: يُعد نفق SSH هو fallback العام.
- بالنسبة إلى **Nodes ‏(iOS/Android والأجهزة المستقبلية)**: يتم الاتصال بـ **Gateway WebSocket** ‏(LAN/tailnet أو نفق SSH حسب الحاجة).

## الفكرة الأساسية

- ترتبط Gateway WebSocket بعنوان **loopback** على المنفذ المهيأ (الافتراضي 18789).
- للاستخدام البعيد، تقوم بتمرير منفذ loopback هذا عبر SSH (أو تستخدم tailnet/VPN وتقلل الحاجة إلى الأنفاق).

## إعدادات VPN/tailnet الشائعة (مكان وجود الوكيل)

فكّر في **مضيف Gateway** على أنه “المكان الذي يعيش فيه الوكيل”. فهو يملك الجلسات، وauth profiles، والقنوات، والحالة.
ويتصل حاسوبك المحمول/سطح المكتب (وكذلك Nodes) بهذا المضيف.

### 1) Gateway دائمة التشغيل في tailnet الخاصة بك (VPS أو خادم منزلي)

شغّل Gateway على مضيف دائم الوصول عبر **Tailscale** أو SSH.

- **أفضل تجربة استخدام:** أبقِ `gateway.bind: "loopback"` واستخدم **Tailscale Serve** من أجل Control UI.
- **Fallback:** أبقِ loopback + نفق SSH من أي جهاز يحتاج إلى الوصول.
- **أمثلة:** [exe.dev](/ar/install/exe-dev) (آلة افتراضية سهلة) أو [Hetzner](/ar/install/hetzner) ‏(VPS إنتاجي).

وهذا مثالي عندما ينام حاسوبك المحمول كثيرًا لكنك تريد أن يبقى الوكيل دائم التشغيل.

### 2) سطح المكتب المنزلي يشغّل Gateway، والحاسوب المحمول هو جهاز التحكم البعيد

لا يشغّل الحاسوب المحمول الوكيل. بل يتصل عن بُعد:

- استخدم وضع **Remote over SSH** في تطبيق macOS (الإعدادات ← عام ← “OpenClaw runs”).
- يفتح التطبيق النفق ويديره، لذلك يعمل WebChat + فحوصات السلامة “بشكل مباشر”.

دليل التشغيل: [الوصول البعيد على macOS](/ar/platforms/mac/remote).

### 3) الحاسوب المحمول يشغّل Gateway، مع وصول بعيد من أجهزة أخرى

أبقِ Gateway محلية لكن عرّضها بأمان:

- نفق SSH إلى الحاسوب المحمول من أجهزة أخرى، أو
- استخدم Tailscale Serve مع Control UI مع إبقاء Gateway مقتصرة على loopback.

الدليل: [Tailscale](/ar/gateway/tailscale) و[نظرة عامة على الويب](/ar/web).

## تدفق الأوامر (ما الذي يعمل وأين)

تملك خدمة gateway واحدة الحالة + القنوات. أما Nodes فهي أطراف تابعة.

مثال على التدفق (Telegram → Node):

- تصل رسالة Telegram إلى **Gateway**.
- تشغّل Gateway **الوكيل** وتقرر ما إذا كانت ستستدعي أداة Node.
- تستدعي Gateway **Node** عبر Gateway WebSocket ‏(`node.*` RPC).
- تعيد Node النتيجة؛ ثم ترد Gateway إلى Telegram.

ملاحظات:

- **لا تشغّل Nodes خدمة gateway.** يجب أن تعمل Gateway واحدة فقط لكل مضيف ما لم تكن تدير ملفات تعريف معزولة عمدًا (راجع [Gateways متعددة](/ar/gateway/multiple-gateways)).
- “وضع Node” في تطبيق macOS ليس إلا عميل Node عبر Gateway WebSocket.

## نفق SSH ‏(CLI + الأدوات)

أنشئ نفقًا محليًا إلى Gateway WS البعيدة:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

مع تشغيل النفق:

- سيصل `openclaw health` و`openclaw status --deep` الآن إلى Gateway البعيدة عبر `ws://127.0.0.1:18789`.
- ويمكن أيضًا لـ `openclaw gateway status` و`openclaw gateway health` و`openclaw gateway probe` و`openclaw gateway call` استهداف عنوان URL المُمرَّر عبر `--url` عند الحاجة.

ملاحظة: استبدل `18789` بـ `gateway.port` المهيأ لديك (أو `--port`/`OPENCLAW_GATEWAY_PORT`).
ملاحظة: عندما تمرر `--url`، لا تعود CLI إلى بيانات الاعتماد الموجودة في التهيئة أو البيئة.
مرّر `--token` أو `--password` صراحةً. ويُعد غياب بيانات الاعتماد الصريحة خطأ.

## القيم الافتراضية البعيدة لـ CLI

يمكنك حفظ هدف بعيد بحيث تستخدمه أوامر CLI افتراضيًا:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

عندما تكون Gateway مقتصرة على loopback، أبقِ عنوان URL على `ws://127.0.0.1:18789` وافتح نفق SSH أولًا.

## أولوية بيانات الاعتماد

يتبع حل بيانات اعتماد Gateway عقدًا مشتركًا واحدًا عبر مسارات call/probe/status ومراقبة Discord exec-approval. ويستخدم Node-host العقد الأساسي نفسه مع استثناء واحد في الوضع المحلي (إذ يتجاهل عمدًا `gateway.remote.*`):

- تكون بيانات الاعتماد الصريحة (`--token` أو `--password` أو أداة `gatewayToken`) هي الأسبق دائمًا في مسارات الاستدعاء التي تقبل مصادقة صريحة.
- أمان تجاوز عنوان URL:
  - لا تعيد تجاوزات عنوان URL في CLI (`--url`) استخدام بيانات اعتماد ضمنية من التهيئة/البيئة مطلقًا.
  - يمكن لتجاوزات عنوان URL من البيئة (`OPENCLAW_GATEWAY_URL`) استخدام بيانات اعتماد البيئة فقط (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- القيم الافتراضية في الوضع المحلي:
  - token: ‏`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (لا ينطبق fallback البعيد إلا عندما يكون إدخال token للمصادقة المحلية غير مضبوط)
  - password: ‏`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (لا ينطبق fallback البعيد إلا عندما يكون إدخال password للمصادقة المحلية غير مضبوط)
- القيم الافتراضية في الوضع البعيد:
  - token: ‏`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: ‏`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- استثناء الوضع المحلي لـ Node-host: يتم تجاهل `gateway.remote.token` / `gateway.remote.password`.
- تكون فحوصات token في probe/status البعيدتين صارمة افتراضيًا: فهي تستخدم `gateway.remote.token` فقط (من دون fallback إلى token محلية) عند استهداف الوضع البعيد.
- تستخدم تجاوزات البيئة الخاصة بـ Gateway القيم `OPENCLAW_GATEWAY_*` فقط.

## واجهة الدردشة عبر SSH

لم يعد WebChat يستخدم منفذ HTTP منفصلًا. إذ تتصل واجهة SwiftUI chat مباشرة بـ Gateway WebSocket.

- مرّر المنفذ `18789` عبر SSH (راجع أعلاه)، ثم اربط العملاء بـ `ws://127.0.0.1:18789`.
- على macOS، يُفضَّل وضع “Remote over SSH” في التطبيق، إذ يدير النفق تلقائيًا.

## "Remote over SSH" في تطبيق macOS

يمكن لتطبيق شريط القوائم على macOS تشغيل الإعداد نفسه من البداية إلى النهاية (فحوصات الحالة البعيدة، وWebChat، وتمرير Voice Wake).

دليل التشغيل: [الوصول البعيد على macOS](/ar/platforms/mac/remote).

## قواعد الأمان (البعيد/VPN)

باختصار: **أبقِ Gateway مقتصرة على loopback** ما لم تكن متأكدًا أنك تحتاج إلى bind.

- **Loopback + SSH/Tailscale Serve** هو الافتراضي الأكثر أمانًا (من دون تعريض عام).
- يكون `ws://` غير المشفر مقتصرًا افتراضيًا على loopback فقط. وبالنسبة إلى الشبكات الخاصة الموثوقة،
  اضبط `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` على عملية العميل
  كحل كسر زجاج للطوارئ. ولا يوجد مكافئ له في `openclaw.json`؛ يجب أن يكون ذلك في
  بيئة العملية الخاصة بالعميل الذي ينشئ اتصال WebSocket.
- يجب أن تستخدم **الروابط غير loopback** ‏(`lan`/`tailnet`/`custom`، أو `auto` عندما لا تكون loopback متاحة) مصادقة Gateway: token أو password أو reverse proxy واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`.
- إن `gateway.remote.token` / `.password` هما مصدران لبيانات اعتماد العميل. وهما **لا** يهيئان مصادقة الخادم بمفردهما.
- يمكن لمسارات الاستدعاء المحلية استخدام `gateway.remote.*` كخيار fallback فقط عندما تكون `gateway.auth.*` غير مضبوطة.
- إذا كانت `gateway.auth.token` / `gateway.auth.password` مهيأة صراحةً عبر SecretRef ولم تُحل، فإن الحل يفشل بشكل مغلق (من دون fallback بعيد يخفي المشكلة).
- يقوم `gateway.remote.tlsFingerprint` بتثبيت شهادة TLS البعيدة عند استخدام `wss://`.
- يمكن لـ **Tailscale Serve** مصادقة حركة Control UI/WebSocket عبر رؤوس الهوية
  عندما تكون `gateway.auth.allowTailscale: true`؛ أما نقاط نهاية HTTP API فلا
  تستخدم مصادقة رؤوس Tailscale هذه، بل تتبع وضع مصادقة HTTP العادي الخاص بـ gateway. ويفترض هذا التدفق بلا token أن مضيف gateway موثوق. اضبطه على
  `false` إذا كنت تريد مصادقة بالسر المشترك في كل مكان.
- مصادقة **Trusted-proxy** مخصصة فقط لإعدادات الوكيل غير loopback الواعية بالهوية.
  ولا تستوفي reverse proxies المحلية على المضيف نفسه شرط `gateway.auth.mode: "trusted-proxy"`.
- تعامل مع التحكم في المتصفح كما تتعامل مع وصول المشغّل: tailnet فقط + اقتران Node متعمد.

شرح أعمق: [الأمان](/ar/gateway/security).

### macOS: نفق SSH دائم عبر LaunchAgent

بالنسبة إلى عملاء macOS الذين يتصلون بـ gateway بعيدة، فإن أسهل إعداد دائم يستخدم إدخال SSH ‏`LocalForward` بالإضافة إلى LaunchAgent للإبقاء على النفق حيًا عبر إعادة التشغيل والانهيارات.

#### الخطوة 1: أضف تهيئة SSH

حرّر `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

استبدل `<REMOTE_IP>` و`<REMOTE_USER>` بقيمك.

#### الخطوة 2: انسخ مفتاح SSH (مرة واحدة)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### الخطوة 3: هيّئ token الخاصة بـ Gateway

احفظ token في التهيئة حتى تبقى موجودة عبر عمليات إعادة التشغيل:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### الخطوة 4: أنشئ LaunchAgent

احفظ هذا في `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### الخطوة 5: حمّل LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

سيبدأ النفق تلقائيًا عند تسجيل الدخول، ويُعاد تشغيله عند الانهيار، ويحافظ على بقاء المنفذ المُمرَّر حيًا.

ملاحظة: إذا كان لديك LaunchAgent قديم باسم `com.openclaw.ssh-tunnel` من إعداد سابق، فقم بإلغاء تحميله وحذفه.

#### استكشاف الأخطاء وإصلاحها

تحقق مما إذا كان النفق يعمل:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

أعد تشغيل النفق:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

أوقف النفق:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| إدخال التهيئة                         | ما الذي يفعله                                                 |
| ------------------------------------- | ------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789`  | يمرّر المنفذ المحلي 18789 إلى المنفذ البعيد 18789             |
| `ssh -N`                              | SSH من دون تنفيذ أوامر بعيدة (تمرير المنافذ فقط)              |
| `KeepAlive`                           | يعيد تشغيل النفق تلقائيًا إذا انهار                           |
| `RunAtLoad`                           | يبدأ النفق عند تحميل LaunchAgent أثناء تسجيل الدخول           |

## ذو صلة

- [Tailscale](/ar/gateway/tailscale)
- [المصادقة](/ar/gateway/authentication)
- [إعداد Gateway البعيدة](/ar/gateway/remote-gateway-readme)
