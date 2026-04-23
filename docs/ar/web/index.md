---
read_when:
    - تريد الوصول إلى Gateway عبر Tailscale
    - تريد Control UI في المتصفح وتحرير الإعدادات
summary: 'أسطح الويب الخاصة بـ Gateway: ‏Control UI، وأوضاع bind، والأمان'
title: الويب
x-i18n:
    generated_at: "2026-04-23T07:35:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# الويب (Gateway)

تخدم Gateway **Control UI** صغيرة للمتصفح (Vite + Lit) من المنفذ نفسه الذي تستخدمه Gateway WebSocket:

- الافتراضي: `http://<host>:18789/`
- بادئة اختيارية: اضبط `gateway.controlUi.basePath` (مثل `/openclaw`)

توجد القدرات في [Control UI](/ar/web/control-ui).
تركّز هذه الصفحة على أوضاع bind، والأمان، والأسطح المواجهة للويب.

## Webhooks

عندما تكون `hooks.enabled=true`, تعرض Gateway أيضًا نقطة نهاية Webhook صغيرة على خادم HTTP نفسه.
راجع [تهيئة Gateway](/ar/gateway/configuration) ← `hooks` للمصادقة + الحمولات.

## الإعدادات (مفعّلة افتراضيًا)

تكون Control UI **مفعّلة افتراضيًا** عندما تكون الأصول موجودة (`dist/control-ui`).
يمكنك التحكم بها عبر الإعدادات:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath اختيارية
  },
}
```

## الوصول عبر Tailscale

### Serve المدمج (موصى به)

أبقِ Gateway على loopback ودع Tailscale Serve تمررها عبر proxy:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

ثم ابدأ تشغيل gateway:

```bash
openclaw gateway
```

افتح:

- `https://<magicdns>/` (أو `gateway.controlUi.basePath` المضبوطة لديك)

### bind على Tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

ثم ابدأ تشغيل gateway (هذا المثال غير loopback يستخدم
مصادقة token بسر مشترك):

```bash
openclaw gateway
```

افتح:

- `http://<tailscale-ip>:18789/` (أو `gateway.controlUi.basePath` المضبوطة لديك)

### الإنترنت العام (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // أو OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## ملاحظات أمنية

- تكون مصادقة Gateway مطلوبة افتراضيًا (token، أو password، أو trusted-proxy، أو رؤوس هوية Tailscale Serve عند تفعيلها).
- ما تزال عمليات bind غير loopback **تتطلب** مصادقة gateway. وعمليًا، يعني هذا مصادقة token/password أو reverse proxy مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`.
- ينشئ المعالج مصادقة بسر مشترك افتراضيًا ويولّد عادةً
  token للـ gateway (حتى على loopback).
- في وضع السر المشترك، ترسل UI القيمة `connect.params.auth.token` أو
  `connect.params.auth.password`.
- أما في الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy`, فيتم
  استيفاء فحص مصادقة WebSocket من رؤوس الطلب بدلًا من ذلك.
- بالنسبة إلى عمليات نشر Control UI غير loopback، اضبط `gateway.controlUi.allowedOrigins`
  صراحةً (الأصول الكاملة). ومن دون ذلك، يُرفض بدء تشغيل gateway افتراضيًا.
- يفعّل `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
  وضع fallback لأصل Host-header، لكنه خفض أمني خطير.
- مع Serve، يمكن لرؤوس هوية Tailscale استيفاء مصادقة Control UI/WebSocket
  عندما تكون `gateway.auth.allowTailscale` بقيمة `true` (من دون الحاجة إلى token/password).
  أما نقاط نهاية HTTP API فلا تستخدم رؤوس هوية Tailscale تلك؛ بل تتبع
  وضع مصادقة HTTP العادي في gateway بدلًا من ذلك. اضبط
  `gateway.auth.allowTailscale: false` لفرض بيانات اعتماد صريحة. راجع
  [Tailscale](/ar/gateway/tailscale) و[الأمان](/ar/gateway/security). ويفترض هذا
  التدفق بدون token أن مضيف gateway موثوق.
- تتطلب `gateway.tailscale.mode: "funnel"` القيمة `gateway.auth.mode: "password"` (كلمة مرور مشتركة).

## بناء UI

تخدم Gateway ملفات ثابتة من `dist/control-ui`. ابنِها باستخدام:

```bash
pnpm ui:build
```
