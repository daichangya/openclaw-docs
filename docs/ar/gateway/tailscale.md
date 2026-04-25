---
read_when:
    - تعريض واجهة Control UI الخاصة بـ Gateway خارج localhost
    - أتمتة الوصول إلى لوحة التحكم عبر tailnet أو بشكل عام
summary: تكامل Tailscale Serve/Funnel مع لوحة تحكم Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-25T13:49:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6042ddaf7194b34f003b1cdf5226f4693da22663d4007c65c79580e7f8ea2835
    source_path: gateway/tailscale.md
    workflow: 15
---

يمكن لـ OpenClaw ضبط Tailscale **Serve** (tailnet) أو **Funnel** (عام) تلقائيًا لـ
لوحة تحكم Gateway ومنفذ WebSocket. وهذا يُبقي Gateway مرتبطًا بـ loopback بينما
يوفر Tailscale بروتوكول HTTPS، والتوجيه، و(في حالة Serve) رؤوس الهوية.

## الأوضاع

- `serve`: ‏Serve خاص بـ Tailnet فقط عبر `tailscale serve`. ويبقى gateway على `127.0.0.1`.
- `funnel`: ‏HTTPS عام عبر `tailscale funnel`. ويتطلب OpenClaw كلمة مرور مشتركة.
- `off`: الافتراضي (من دون أتمتة Tailscale).

## المصادقة

اضبط `gateway.auth.mode` للتحكم في المصافحة:

- `none` (دخول خاص فقط)
- `token` (الافتراضي عندما يكون `OPENCLAW_GATEWAY_TOKEN` مضبوطًا)
- `password` (سر مشترك عبر `OPENCLAW_GATEWAY_PASSWORD` أو الإعدادات)
- `trusted-proxy` (reverse proxy مدرك للهوية؛ راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth))

عندما تكون `tailscale.mode = "serve"` وتكون `gateway.auth.allowTailscale` مساوية لـ `true`،
يمكن لمصادقة Control UI/WebSocket استخدام رؤوس هوية Tailscale
(`tailscale-user-login`) من دون تقديم token/كلمة مرور. ويتحقق OpenClaw من
الهوية عبر تحليل عنوان `x-forwarded-for` من خلال daemon المحلي لـ Tailscale
(`tailscale whois`) ومطابقته مع الترويسة قبل قبوله.
ولا يتعامل OpenClaw مع الطلب على أنه Serve إلا عندما يصل من loopback مع
رؤوس Tailscale `x-forwarded-for` و`x-forwarded-proto` و`x-forwarded-host`.
أما نقاط نهاية HTTP API (مثل `/v1/*`، و`/tools/invoke`، و`/api/channels/*`)
فلا تستخدم مصادقة رؤوس الهوية الخاصة بـ Tailscale. بل إنها تظل تتبع
وضع مصادقة HTTP العادي في gateway: مصادقة سر مشترك افتراضيًا، أو
إعداد trusted-proxy / `none` للدخول الخاص إذا تم ضبطه عمدًا.
يفترض هذا التدفق من دون token أن مضيف gateway موثوق. وإذا كان من الممكن
أن يعمل كود محلي غير موثوق على المضيف نفسه، فعطّل `gateway.auth.allowTailscale` واطلب
مصادقة token/كلمة مرور بدلًا من ذلك.
ولطلب بيانات اعتماد صريحة بسر مشترك، اضبط `gateway.auth.allowTailscale: false`
واستخدم `gateway.auth.mode: "token"` أو `"password"`.

## أمثلة الإعدادات

### tailnet فقط (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

افتح: `https://<magicdns>/` (أو `gateway.controlUi.basePath` الذي ضبطته)

### tailnet فقط (الربط بعنوان Tailnet IP)

استخدم هذا عندما تريد أن يستمع Gateway مباشرة على عنوان Tailnet IP (من دون Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

اتصل من جهاز Tailnet آخر:

- Control UI: ‏`http://<tailscale-ip>:18789/`
- WebSocket: ‏`ws://<tailscale-ip>:18789`

ملاحظة: لن يعمل loopback (`http://127.0.0.1:18789`) **في هذا الوضع**.

### الإنترنت العام (Funnel + كلمة مرور مشتركة)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

فضّل `OPENCLAW_GATEWAY_PASSWORD` على حفظ كلمة مرور في القرص.

## أمثلة CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## ملاحظات

- يتطلب Tailscale Serve/Funnel أن يكون CLI الخاص بـ `tailscale` مثبتًا ومسجل الدخول.
- يرفض `tailscale.mode: "funnel"` البدء ما لم يكن وضع المصادقة `password` لتجنب التعريض العام.
- اضبط `gateway.tailscale.resetOnExit` إذا كنت تريد من OpenClaw التراجع عن إعداد
  `tailscale serve` أو `tailscale funnel` عند الإيقاف.
- `gateway.bind: "tailnet"` هو ربط مباشر بـ Tailnet (من دون HTTPS، ومن دون Serve/Funnel).
- يفضّل `gateway.bind: "auto"` loopback؛ استخدم `tailnet` إذا كنت تريد Tailnet فقط.
- يعرّض Serve/Funnel فقط **واجهة التحكم في Gateway + WS**. وتتصل العُقد عبر
  نقطة نهاية Gateway WS نفسها، لذا يمكن أن يعمل Serve من أجل وصول العُقد.

## التحكم بالمتصفح (Gateway بعيد + متصفح محلي)

إذا كنت تشغّل Gateway على جهاز وتريد التحكم بمتصفح على جهاز آخر،
فشغّل **مضيف عقدة** على جهاز المتصفح وأبقِ كليهما على tailnet نفسه.
وسيقوم Gateway بتمرير إجراءات المتصفح إلى العقدة؛ ولا حاجة إلى خادم تحكم منفصل أو عنوان Serve.

تجنب Funnel للتحكم بالمتصفح؛ وتعامل مع اقتران العُقد كما تتعامل مع وصول operator.

## المتطلبات المسبقة والقيود الخاصة بـ Tailscale

- يتطلب Serve تفعيل HTTPS لـ tailnet لديك؛ وسيطالبك CLI إذا كان مفقودًا.
- يحقن Serve رؤوس هوية Tailscale؛ أما Funnel فلا يفعل.
- يتطلب Funnel إصدار Tailscale ‏v1.38.3+، وMagicDNS، وتفعيل HTTPS، وسمة funnel node.
- لا يدعم Funnel إلا المنافذ `443` و`8443` و`10000` عبر TLS.
- يتطلب Funnel على macOS استخدام النسخة مفتوحة المصدر من تطبيق Tailscale.

## تعلّم المزيد

- نظرة عامة على Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- أمر `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نظرة عامة على Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- أمر `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ذو صلة

- [الوصول عن بُعد](/ar/gateway/remote)
- [الاكتشاف](/ar/gateway/discovery)
- [المصادقة](/ar/gateway/authentication)
