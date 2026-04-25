---
read_when:
    - بناء عملاء العُقد أو تصحيح أخطائهم (وضع العقدة على iOS/Android/macOS)
    - التحقيق في حالات فشل pairing أو مصادقة الجسر
    - تدقيق سطح العقدة الذي يكشفه الـ Gateway
summary: 'بروتوكول الجسر التاريخي (العُقد القديمة): ‏TCP JSONL، وpairing، وRPC ذي النطاقات المحددة'
title: بروتوكول الجسر
x-i18n:
    generated_at: "2026-04-25T13:46:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
تمت **إزالة** جسر TCP. لا تشحن إصدارات OpenClaw الحالية مستمع الجسر، ولم تعد مفاتيح الإعداد `bridge.*` موجودة في المخطط. تُحفظ هذه الصفحة للرجوع التاريخي فقط. استخدم [بروتوكول Gateway](/ar/gateway/protocol) لجميع عملاء العقدة/المشغّل.
</Warning>

## لماذا كان موجودًا

- **حد أمني**: يكشف الجسر قائمة سماح صغيرة بدلًا من
  سطح API الكامل للـ Gateway.
- **Pairing + هوية العقدة**: يملك الـ Gateway قبول العقدة ويربطه
  بـ token لكل عقدة.
- **تجربة اكتشاف**: يمكن للعُقد اكتشاف Gateways عبر Bonjour على الشبكة المحلية، أو الاتصال
  مباشرة عبر tailnet.
- **Loopback WS**: تظل طبقة التحكم الكاملة عبر WS محلية ما لم يتم تمريرها عبر SSH.

## النقل

- ‏TCP، وكائن JSON واحد لكل سطر (JSONL).
- ‏TLS اختياري (عندما تكون `bridge.tls.enabled` هي true).
- كان منفذ المستمع الافتراضي التاريخي هو `18790` (لا تبدأ الإصدارات الحالية
  جسر TCP).

عند تمكين TLS، تتضمن سجلات TXT الخاصة بالاكتشاف `bridgeTls=1` بالإضافة إلى
`bridgeTlsSha256` كتلميح غير سري. لاحظ أن سجلات TXT في Bonjour/mDNS غير
موثقة؛ ويجب على العملاء ألا يتعاملوا مع البصمة المُعلن عنها على أنها
تثبيت موثوق من دون نية صريحة من المستخدم أو تحقق آخر خارج النطاق.

## المصافحة + pairing

1. يرسل العميل `hello` مع بيانات تعريف العقدة + token (إذا كانت مقترنة بالفعل).
2. إذا لم تكن مقترنة، يرد الـ Gateway بـ `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. يرسل العميل `pair-request`.
4. ينتظر الـ Gateway الموافقة، ثم يرسل `pair-ok` و`hello-ok`.

تاريخيًا، كان `hello-ok` يعيد `serverName` وكان يمكن أن يتضمن
`canvasHostUrl`.

## الإطارات

العميل → Gateway:

- `req` / `res`: ‏RPC Gateway ذو نطاقات محددة (الدردشة، والجلسات، والإعداد، والصحة، وvoicewake، وskills.bins)
- `event`: إشارات العقدة (نص صوتي، وطلب وكيل، واشتراك دردشة، ودورة حياة exec)

Gateway → العميل:

- `invoke` / `invoke-res`: أوامر العقدة (`canvas.*` و`camera.*` و`screen.record` و
  `location.get` و`sms.send`)
- `event`: تحديثات الدردشة للجلسات المشتركة
- `ping` / `pong`: إبقاء الاتصال حيًا

كان تنفيذ قائمة السماح القديمة موجودًا في `src/gateway/server-bridge.ts` (تمت إزالته).

## أحداث دورة حياة Exec

يمكن للعُقد إطلاق أحداث `exec.finished` أو `exec.denied` لإظهار نشاط system.run.
ويتم ربطها بأحداث النظام في الـ Gateway. (وقد تظل العُقد القديمة تطلق `exec.started`.)

حقول الحمولة (كلها اختيارية ما لم يُذكر خلاف ذلك):

- `sessionKey` (مطلوب): جلسة الوكيل التي ستستقبل حدث النظام.
- `runId`: معرّف exec فريد للتجميع.
- `command`: سلسلة الأمر الخام أو المنسقة.
- `exitCode` و`timedOut` و`success` و`output`: تفاصيل الإكمال (في finished فقط).
- `reason`: سبب الرفض (في denied فقط).

## استخدام tailnet التاريخي

- اربط الجسر بعنوان IP لـ tailnet: ‏`bridge.bind: "tailnet"` في
  `~/.openclaw/openclaw.json` (تاريخي فقط؛ لم يعد `bridge.*` صالحًا).
- يتصل العملاء عبر اسم MagicDNS أو عنوان IP لـ tailnet.
- لا يعبر Bonjour **الشبكات**؛ استخدم المضيف/المنفذ اليدوي أو DNS‑SD واسع النطاق
  عند الحاجة.

## الإصدار

كان الجسر **v1 ضمنيًا** (من دون تفاوض min/max). هذا القسم
مرجع تاريخي فقط؛ وتستخدم عملاء العقدة/المشغّل الحالية [بروتوكول Gateway](/ar/gateway/protocol)
عبر WebSocket.

## ذو صلة

- [بروتوكول Gateway](/ar/gateway/protocol)
- [Nodes](/ar/nodes)
