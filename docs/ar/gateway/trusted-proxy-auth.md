---
read_when:
    - تشغيل OpenClaw خلف وكيل واعٍ بالهوية
    - إعداد Pomerium أو Caddy أو nginx مع OAuth أمام OpenClaw
    - إصلاح أخطاء WebSocket 1008 غير المصرح بها في إعدادات الوكيل العكسي
    - اتخاذ قرار بشأن موضع ضبط HSTS وترويسات تقوية HTTP الأخرى
summary: تفويض مصادقة Gateway إلى وكيل عكسي موثوق (Pomerium أو Caddy أو nginx + OAuth)
title: مصادقة الوكيل الموثوق
x-i18n:
    generated_at: "2026-04-23T07:25:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# مصادقة الوكيل الموثوق

> ⚠️ **ميزة حساسة أمنيًا.** يفوّض هذا الوضع المصادقة بالكامل إلى الوكيل العكسي لديك. قد يؤدي سوء الإعداد إلى كشف Gateway الخاص بك لوصول غير مصرّح به. اقرأ هذه الصفحة بعناية قبل التفعيل.

## متى تستخدمها

استخدم وضع المصادقة `trusted-proxy` عندما:

- تشغّل OpenClaw خلف **وكيل واعٍ بالهوية** (Pomerium أو Caddy + OAuth أو nginx + oauth2-proxy أو Traefik + forward auth)
- يتولى الوكيل كل المصادقة ويمرر هوية المستخدم عبر الترويسات
- تكون في بيئة Kubernetes أو حاويات حيث يكون الوكيل هو المسار الوحيد إلى Gateway
- تواجه أخطاء WebSocket `1008 unauthorized` لأن المتصفحات لا تستطيع تمرير الرموز في حمولة WS

## متى لا تستخدمها

- إذا كان وكيلك لا يصادق المستخدمين (مجرد منهي TLS أو موازن حمل)
- إذا كان هناك أي مسار إلى Gateway يتجاوز الوكيل (ثغرات في الجدار الناري، وصول من الشبكة الداخلية)
- إذا لم تكن متأكدًا من أن وكيلك يزيل/يستبدل الترويسات المُمرَّرة بشكل صحيح
- إذا كنت تحتاج فقط إلى وصول شخصي لمستخدم واحد (فكّر في Tailscale Serve + loopback لإعداد أبسط)

## كيف تعمل

1. يصادق الوكيل العكسي لديك المستخدمين (OAuth أو OIDC أو SAML أو غير ذلك)
2. يضيف الوكيل ترويسة تحتوي على هوية المستخدم المصادق عليه (مثل: `x-forwarded-user: nick@example.com`)
3. يتحقق OpenClaw من أن الطلب جاء من **عنوان IP لوكيل موثوق** (مهيأ في `gateway.trustedProxies`)
4. يستخرج OpenClaw هوية المستخدم من الترويسة المهيأة
5. إذا كان كل شيء صحيحًا، يُصرّح للطلب

## التحكم في سلوك الاقتران في Control UI

عندما يكون `gateway.auth.mode = "trusted-proxy"` نشطًا ويمر الطلب
بفحوصات الوكيل الموثوق، يمكن لجلسات WebSocket الخاصة بـ Control UI الاتصال من دون
هوية اقتران الجهاز.

الآثار المترتبة:

- لم يعد الاقتران هو البوابة الأساسية للوصول إلى Control UI في هذا الوضع.
- تصبح سياسة مصادقة الوكيل العكسي لديك و`allowUsers` هما التحكم الفعلي في الوصول.
- أبقِ إدخال gateway مقصورًا على عناوين IP الوكيل الموثوق فقط (`gateway.trustedProxies` + الجدار الناري).

## الإعدادات

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

قاعدة وقت تشغيل مهمة:

- ترفض مصادقة الوكيل الموثوق الطلبات القادمة من loopback (`127.0.0.1` و`::1` وCIDRs الخاصة بـ loopback).
- لا تفي الوكلاء العكسية الموجودة على المضيف نفسه عبر loopback بمتطلبات مصادقة الوكيل الموثوق.
- بالنسبة إلى إعدادات الوكيل عبر loopback وعلى المضيف نفسه، استخدم مصادقة الرمز/كلمة المرور بدلًا من ذلك، أو مرّر الطلب عبر عنوان وكيل موثوق غير loopback يمكن لـ OpenClaw التحقق منه.
- لا تزال عمليات نشر Control UI غير القائمة على loopback تحتاج إلى `gateway.controlUi.allowedOrigins` صريح.
- **أدلة الترويسات المُمرَّرة تتغلب على محلية loopback.** إذا وصل طلب عبر loopback لكنه يحمل ترويسات `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` تشير إلى أصل غير محلي، فإن هذا الدليل يُسقط ادعاء المحلية عبر loopback. ويُعامل الطلب على أنه بعيد بالنسبة إلى الاقتران ومصادقة الوكيل الموثوق وبوابة هوية الجهاز الخاصة بـ Control UI. وهذا يمنع وكيل loopback على المضيف نفسه من تمرير هوية الترويسات المُمرَّرة إلى مصادقة الوكيل الموثوق.

### مرجع الإعدادات

| الحقل                                      | مطلوب | الوصف |
| ------------------------------------------ | ------ | ----- |
| `gateway.trustedProxies`                   | نعم    | مصفوفة بعناوين IP الخاصة بالوكلاء الموثوقين. تُرفض الطلبات من عناوين IP أخرى. |
| `gateway.auth.mode`                        | نعم    | يجب أن تكون `"trusted-proxy"` |
| `gateway.auth.trustedProxy.userHeader`     | نعم    | اسم الترويسة التي تحتوي على هوية المستخدم المصادق عليه |
| `gateway.auth.trustedProxy.requiredHeaders`| لا     | ترويسات إضافية يجب أن تكون موجودة حتى يُعتبر الطلب موثوقًا |
| `gateway.auth.trustedProxy.allowUsers`     | لا     | قائمة سماح بهويات المستخدمين. وتعني القيمة الفارغة السماح بكل المستخدمين المصادق عليهم. |

## إنهاء TLS وHSTS

استخدم نقطة إنهاء TLS واحدة وطبّق HSTS فيها.

### النمط الموصى به: إنهاء TLS في الوكيل

عندما يتولى الوكيل العكسي HTTPS لـ `https://control.example.com`، اضبط
`Strict-Transport-Security` في الوكيل لذلك النطاق.

- مناسب جيدًا لعمليات النشر المواجهة للإنترنت.
- يبقي الشهادات + سياسة تقوية HTTP في مكان واحد.
- يمكن أن يبقى OpenClaw على HTTP عبر loopback خلف الوكيل.

مثال على قيمة الترويسة:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### إنهاء TLS في Gateway

إذا كان OpenClaw نفسه يقدّم HTTPS مباشرة (من دون وكيل ينهي TLS)، فاضبط:

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

يقبل `strictTransportSecurity` قيمة ترويسة نصية أو `false` للتعطيل الصريح.

### إرشادات الطرح

- ابدأ أولًا بعمر أقصى قصير (مثل `max-age=300`) أثناء التحقق من حركة المرور.
- زد إلى قيم طويلة العمر (مثل `max-age=31536000`) فقط بعد ارتفاع الثقة.
- أضف `includeSubDomains` فقط إذا كان كل نطاق فرعي جاهزًا لـ HTTPS.
- استخدم preload فقط إذا كنت تستوفي عمدًا متطلبات preload لمجموعة نطاقاتك الكاملة.
- لا تستفيد بيئات التطوير المحلية القائمة على loopback فقط من HSTS.

## أمثلة إعداد الوكيل

### Pomerium

يمرّر Pomerium الهوية في `x-pomerium-claim-email` (أو ترويسات claims أخرى) وJWT في `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Pomerium's IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

مقتطف إعداد Pomerium:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy مع OAuth

يمكن لـ Caddy مع Plugin `caddy-security` مصادقة المستخدمين وتمرير ترويسات الهوية.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

مقتطف Caddyfile:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

يقوم oauth2-proxy بمصادقة المستخدمين ويمرر الهوية في `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

مقتطف إعداد nginx:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik مع Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // Traefik container IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## إعدادات الرموز المختلطة

يرفض OpenClaw الإعدادات الملتبسة التي يكون فيها كلٌّ من `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`) ووضع `trusted-proxy` نشطين في الوقت نفسه. ويمكن أن تتسبب إعدادات الرموز المختلطة في أن تُصادق طلبات loopback بصمت على مسار المصادقة الخطأ.

إذا رأيت خطأ `mixed_trusted_proxy_token` عند بدء التشغيل:

- أزل الرمز المشترك عند استخدام وضع trusted-proxy، أو
- بدّل `gateway.auth.mode` إلى `"token"` إذا كنت تنوي استخدام المصادقة القائمة على الرمز.

كما أن مصادقة الوكيل الموثوق عبر loopback تفشل بشكل مغلق: يجب على المتصلين من المضيف نفسه توفير ترويسات الهوية المهيأة عبر وكيل موثوق بدلًا من أن تتم مصادقتهم بصمت.

## ترويسة نطاقات operator

تُعد مصادقة الوكيل الموثوق وضع HTTP **حاملًا للهوية**، لذلك يمكن للمتصلين
اختياريًا التصريح بنطاقات operator باستخدام `x-openclaw-scopes`.

أمثلة:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

السلوك:

- عندما تكون الترويسة موجودة، يحترم OpenClaw مجموعة النطاقات المصرّح بها.
- عندما تكون الترويسة موجودة لكنها فارغة، يصرّح الطلب بأنه **لا** يملك أي نطاقات operator.
- عندما تكون الترويسة غائبة، تعود واجهات HTTP الحاملة للهوية العادية إلى مجموعة نطاقات operator الافتراضية القياسية.
- تكون **مسارات HTTP الخاصة بـ plugin والمصادَق عليها من gateway** أضيق افتراضيًا: عندما يغيب `x-openclaw-scopes`، يعود نطاق وقت التشغيل فيها إلى `operator.write`.
- لا تزال طلبات HTTP ذات أصل المتصفح بحاجة إلى اجتياز `gateway.controlUi.allowedOrigins` (أو وضع الرجوع الاحتياطي المتعمد لترويسة Host) حتى بعد نجاح مصادقة الوكيل الموثوق.

قاعدة عملية:

- أرسل `x-openclaw-scopes` صراحةً عندما تريد أن يكون طلب trusted-proxy
  أضيق من القيم الافتراضية، أو عندما يحتاج مسار plugin مصادق عليه من gateway
  إلى شيء أقوى من نطاق الكتابة.

## قائمة التحقق الأمنية

قبل تفعيل مصادقة الوكيل الموثوق، تحقّق من:

- [ ] **الوكيل هو المسار الوحيد**: منفذ Gateway محمي بجدار ناري من كل شيء باستثناء وكيلك
- [ ] **قيمة trustedProxies محدودة**: فقط عناوين IP الفعلية لوكيلك، وليس شبكات فرعية كاملة
- [ ] **لا يوجد مصدر وكيل عبر loopback**: تفشل مصادقة الوكيل الموثوق بشكل مغلق للطلبات القادمة من loopback
- [ ] **الوكيل يزيل الترويسات**: يستبدل وكيلك (ولا يضيف) ترويسات `x-forwarded-*` القادمة من العملاء
- [ ] **إنهاء TLS**: يتولى وكيلك TLS؛ ويتصل المستخدمون عبر HTTPS
- [ ] **allowedOrigins صريحة**: يستخدم Control UI غير القائم على loopback القيمة الصريحة `gateway.controlUi.allowedOrigins`
- [ ] **تم ضبط allowUsers** (موصى به): قيّدها بالمستخدمين المعروفين بدلًا من السماح لأي مستخدم مصادق عليه
- [ ] **لا يوجد إعداد رموز مختلط**: لا تضبط كلًا من `gateway.auth.token` و`gateway.auth.mode: "trusted-proxy"`

## التدقيق الأمني

سيشير `openclaw security audit` إلى مصادقة الوكيل الموثوق على أنها نتيجة **حرجة**. وهذا مقصود — فهو تذكير بأنك تفوض الأمان إلى إعداد الوكيل لديك.

يتحقق التدقيق من:

- تحذير/تذكير أساسي حرج `gateway.trusted_proxy_auth`
- غياب إعداد `trustedProxies`
- غياب إعداد `userHeader`
- `allowUsers` فارغة (تسمح لأي مستخدم مصادق عليه)
- سياسة أصل متصفح عامة أو مفقودة على أسطح Control UI المكشوفة

## استكشاف الأخطاء وإصلاحها

### "trusted_proxy_untrusted_source"

لم يأت الطلب من عنوان IP موجود في `gateway.trustedProxies`. تحقّق من:

- هل عنوان IP الخاص بالوكيل صحيح؟ (يمكن أن تتغير عناوين IP لحاويات Docker)
- هل يوجد موازن حمل أمام الوكيل لديك؟
- استخدم `docker inspect` أو `kubectl get pods -o wide` للعثور على عناوين IP الفعلية

### "trusted_proxy_loopback_source"

رفض OpenClaw طلب trusted-proxy قادمًا من loopback.

تحقّق من:

- هل يتصل الوكيل من `127.0.0.1` / `::1`؟
- هل تحاول استخدام مصادقة trusted-proxy مع وكيل عكسي عبر loopback وعلى المضيف نفسه؟

الإصلاح:

- استخدم مصادقة الرمز/كلمة المرور لإعدادات الوكيل عبر loopback وعلى المضيف نفسه، أو
- مرّر الطلب عبر عنوان وكيل موثوق غير loopback وأبقِ ذلك العنوان في `gateway.trustedProxies`.

### "trusted_proxy_user_missing"

كانت ترويسة المستخدم فارغة أو مفقودة. تحقّق من:

- هل تم إعداد الوكيل لديك لتمرير ترويسات الهوية؟
- هل اسم الترويسة صحيح؟ (غير حساس لحالة الأحرف، لكن الإملاء مهم)
- هل المستخدم مصادق عليه فعلًا في الوكيل؟

### "trusted*proxy_missing_header*\*"

لم تكن إحدى الترويسات المطلوبة موجودة. تحقّق من:

- إعداد الوكيل لديك لتلك الترويسات تحديدًا
- ما إذا كانت الترويسات تُزال في مكان ما ضمن السلسلة

### "trusted_proxy_user_not_allowed"

المستخدم مصادق عليه لكنه ليس موجودًا في `allowUsers`. أضِفه أو أزل قائمة السماح.

### "trusted_proxy_origin_not_allowed"

نجحت مصادقة trusted-proxy، لكن ترويسة `Origin` الخاصة بالمتصفح لم تجتز فحوصات أصل Control UI.

تحقّق من:

- أن `gateway.controlUi.allowedOrigins` تتضمن أصل المتصفح المطابق تمامًا
- أنك لا تعتمد على أصول عامة wildcard إلا إذا كنت تريد عمدًا سلوك السماح للجميع
- إذا كنت تستخدم عمدًا وضع الرجوع الاحتياطي لترويسة Host، فليكن `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` مضبوطًا عن قصد

### ما زال WebSocket يفشل

تأكد من أن الوكيل لديك:

- يدعم ترقيات WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- يمرر ترويسات الهوية في طلبات ترقية WebSocket (وليس فقط HTTP)
- لا يملك مسار مصادقة منفصلًا لاتصالات WebSocket

## الترحيل من مصادقة الرمز

إذا كنت تنتقل من مصادقة الرمز إلى trusted-proxy:

1. اضبط الوكيل لديك لمصادقة المستخدمين وتمرير الترويسات
2. اختبر إعداد الوكيل بشكل مستقل (`curl` مع الترويسات)
3. حدّث إعدادات OpenClaw باستخدام مصادقة trusted-proxy
4. أعد تشغيل Gateway
5. اختبر اتصالات WebSocket من Control UI
6. شغّل `openclaw security audit` وراجع النتائج

## ذو صلة

- [الأمان](/ar/gateway/security) — دليل الأمان الكامل
- [الإعدادات](/ar/gateway/configuration) — مرجع الإعدادات
- [الوصول عن بُعد](/ar/gateway/remote) — أنماط وصول عن بُعد أخرى
- [Tailscale](/ar/gateway/tailscale) — بديل أبسط للوصول داخل tailnet فقط
