---
read_when:
    - أنت توافق على طلبات اقتران الأجهزة
    - تحتاج إلى تدوير رموز الأجهزة المميزة أو إلغائها
summary: مرجع CLI لـ `openclaw devices` (اقتران الجهاز + تدوير/إلغاء الرموز المميزة)
title: الأجهزة
x-i18n:
    generated_at: "2026-04-25T13:44:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 168afa3c784565c09ebdac854acc33cb7c0cacf4eba6a1a038c88c96af3c1430
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

إدارة طلبات اقتران الأجهزة والرموز المميزة المقيّدة على مستوى الجهاز.

## الأوامر

### `openclaw devices list`

إدراج طلبات الاقتران المعلّقة والأجهزة المقترنة.

```
openclaw devices list
openclaw devices list --json
```

يُظهر خرج الطلبات المعلّقة مستوى الوصول المطلوب بجانب مستوى الوصول
المعتمد حاليًا للجهاز عندما يكون الجهاز مقترنًا بالفعل. وهذا يجعل ترقيات
النطاق/الدور واضحة بدلًا من أن تبدو وكأن الاقتران قد فُقد.

### `openclaw devices remove <deviceId>`

إزالة إدخال جهاز مقترن واحد.

عندما تكون مصادقًا باستخدام رمز جهاز مميز مقترن، لا يمكن للمستدعين غير الإداريين
إزالة إلا إدخال جهازهم **الخاص**. وتتطلب إزالة جهاز آخر
الصلاحية `operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

مسح الأجهزة المقترنة دفعة واحدة.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

الموافقة على طلب اقتران جهاز معلّق باستخدام `requestId` المطابق تمامًا. إذا تم حذف `requestId`
أو تم تمرير `--latest`، فسيقوم OpenClaw فقط بطباعة الطلب المعلّق المحدد
ثم يخرج؛ أعد تشغيل الموافقة باستخدام معرّف الطلب المطابق بعد التحقق
من التفاصيل.

ملاحظة: إذا أعاد جهاز محاولة الاقتران مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح
العام)، فإن OpenClaw يستبدل الإدخال المعلّق السابق ويصدر
`requestId` جديدًا. شغّل `openclaw devices list` مباشرة قبل الموافقة لاستخدام
المعرّف الحالي.

إذا كان الجهاز مقترنًا بالفعل وطلب نطاقات أوسع أو دورًا أوسع،
فإن OpenClaw يُبقي الموافقة الحالية في مكانها وينشئ طلب ترقية معلّقًا
جديدًا. راجع عمودي `Requested` و`Approved` في `openclaw devices list`
أو استخدم `openclaw devices approve --latest` لمعاينة الترقية الدقيقة قبل
الموافقة عليها.

إذا كانت Gateway مُعدّة صراحةً باستخدام
`gateway.nodes.pairing.autoApproveCidrs`، فيمكن الموافقة على طلبات `role: node`
الأولى من عناوين IP المطابقة للعميل قبل أن تظهر في هذه القائمة. وتكون هذه السياسة
معطّلة افتراضيًا ولا تنطبق أبدًا على عملاء operator/browser أو طلبات الترقية.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

رفض طلب اقتران جهاز معلّق.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

تدوير رمز جهاز مميز لدور محدد (مع تحديث النطاقات اختياريًا).
يجب أن يكون الدور المستهدف موجودًا بالفعل ضمن عقد الاقتران المعتمد لذلك الجهاز؛
ولا يمكن للتدوير إصدار دور جديد غير معتمد.
إذا حذفت `--scope`، فإن عمليات إعادة الاتصال اللاحقة باستخدام الرمز المميز المدور المخزّن تعيد استخدام
النطاقات المعتمدة المخزنة مؤقتًا لذلك الرمز.
أما إذا مررت قيم `--scope` صريحة، فستصبح هذه
مجموعة النطاقات المخزنة لعمليات إعادة الاتصال المستقبلية المعتمدة على الرمز المخزن مؤقتًا.
لا يمكن لمستدعي الأجهزة المقترنة غير الإداريين تدوير إلا رمز جهازهم **الخاص**.
كذلك، يجب أن تظل أي قيم `--scope` صريحة ضمن نطاقات operator الخاصة بجلسة المستدعي نفسه؛
ولا يمكن للتدوير إصدار رمز operator أوسع من الذي يمتلكه المستدعي بالفعل.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

يعيد حمولة الرمز المميز الجديد بصيغة JSON.

### `openclaw devices revoke --device <id> --role <role>`

إلغاء رمز جهاز مميز لدور محدد.

لا يمكن لمستدعي الأجهزة المقترنة غير الإداريين إلغاء إلا رمز جهازهم **الخاص**.
ويتطلب إلغاء رمز جهاز آخر الصلاحية `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

يعيد نتيجة الإلغاء بصيغة JSON.

## الخيارات الشائعة

- `--url <url>`: عنوان URL لـ Gateway WebSocket (يستخدم `gateway.remote.url` افتراضيًا عند إعداده).
- `--token <token>`: رمز Gateway المميز (إذا كان مطلوبًا).
- `--password <password>`: كلمة مرور Gateway (مصادقة كلمة المرور).
- `--timeout <ms>`: مهلة RPC.
- `--json`: خرج JSON (موصى به للبرمجة النصية).

ملاحظة: عند تعيين `--url`، لا يرجع CLI إلى بيانات اعتماد الإعدادات أو البيئة.
مرّر `--token` أو `--password` صراحةً. ويُعد غياب بيانات الاعتماد الصريحة خطأً.

## ملاحظات

- يعيد تدوير الرمز المميز رمزًا جديدًا (حساسًا). تعامل معه كسر.
- تتطلب هذه الأوامر النطاق `operator.pairing` (أو `operator.admin`).
- تُعد `gateway.nodes.pairing.autoApproveCidrs` سياسة Gateway اختيارية
  لاقتران أجهزة node الجديدة فقط؛ ولا تغيّر صلاحية الموافقة في CLI.
- يبقى تدوير الرمز المميز ضمن مجموعة الأدوار المعتمدة في الاقتران وخط الأساس
  للنطاقات المعتمدة لذلك الجهاز. ولا يمنح إدخال رمز مخزن مؤقتًا شارد
  هدف تدوير جديدًا.
- بالنسبة إلى جلسات رموز الأجهزة المقترنة، تكون الإدارة عبر الأجهزة الأخرى للإداريين فقط:
  `remove` و`rotate` و`revoke` تكون ذاتية فقط ما لم يمتلك المستدعي
  `operator.admin`.
- تم تقييد `devices clear` عمدًا باستخدام `--yes`.
- إذا لم يكن نطاق الاقتران متاحًا على local loopback (ولم يتم تمرير `--url` صراحةً)، فيمكن للأمرين list/approve استخدام رجوع اقتران محلي.
- يتطلب `devices approve` معرّف طلب صريحًا قبل إصدار الرموز المميزة؛ حذف `requestId` أو تمرير `--latest` يكتفي فقط بمعاينة أحدث طلب معلّق.

## قائمة التحقق لاسترداد انجراف الرمز المميز

استخدم هذا عندما يستمر فشل Control UI أو العملاء الآخرين مع `AUTH_TOKEN_MISMATCH` أو `AUTH_DEVICE_TOKEN_MISMATCH`.

1. أكّد مصدر رمز Gateway المميز الحالي:

```bash
openclaw config get gateway.auth.token
```

2. أدرج الأجهزة المقترنة وحدد معرّف الجهاز المتأثر:

```bash
openclaw devices list
```

3. دوّر رمز operator المميز للجهاز المتأثر:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. إذا لم يكن التدوير كافيًا، فأزل الاقتران القديم ووافق مرة أخرى:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. أعد محاولة اتصال العميل باستخدام الرمز/كلمة المرور المشتركة الحالية.

ملاحظات:

- أولوية مصادقة إعادة الاتصال العادية هي: الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز bootstrap.
- يمكن لاسترداد `AUTH_TOKEN_MISMATCH` الموثوق أن يرسل مؤقتًا كلًا من الرمز المشترك ورمز الجهاز المخزن معًا في محاولة إعادة واحدة مقيّدة.

ذو صلة:

- [استكشاف أخطاء مصادقة Dashboard وإصلاحها](/ar/web/dashboard#if-you-see-unauthorized-1008)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#dashboard-control-ui-connectivity)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Nodes](/ar/nodes)
