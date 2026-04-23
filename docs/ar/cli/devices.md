---
read_when:
    - أنت توافق على طلبات اقتران الأجهزة
    - تحتاج إلى تدوير رموز الأجهزة المميزة أو إلغائها
summary: مرجع CLI لـ `openclaw devices` (اقتران الجهاز + تدوير/إلغاء الرمز المميز)
title: الأجهزة
x-i18n:
    generated_at: "2026-04-23T07:22:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e58d2dff7fc22a11ff372f4937907977dab0ffa9f971b9c0bffeb3e347caf66
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

أدر طلبات اقتران الأجهزة والرموز المميزة الخاصة بنطاق الجهاز.

## الأوامر

### `openclaw devices list`

اعرض طلبات الاقتران المعلقة والأجهزة المقترنة.

```
openclaw devices list
openclaw devices list --json
```

يعرض إخراج الطلبات المعلقة الوصول المطلوب بجوار الوصول الموافق عليه حاليًا للجهاز
عندما يكون الجهاز مقترنًا بالفعل. وهذا يجعل ترقيات النطاق/الدور واضحة بدلًا من أن
تبدو وكأن الاقتران قد فُقد.

### `openclaw devices remove <deviceId>`

أزل إدخال جهاز مقترن واحد.

عندما تكون موثَّقًا باستخدام رمز مميز لجهاز مقترن، لا يمكن للجهات غير الإدارية
إزالة سوى إدخال **جهازها الخاص**. تتطلب إزالة جهاز آخر الصلاحية
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

امسح الأجهزة المقترنة بشكل مجمّع.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

وافق على طلب اقتران جهاز معلق باستخدام `requestId` مطابق تمامًا. إذا تم حذف `requestId`
أو تم تمرير `--latest`، فإن OpenClaw يطبع فقط الطلب المعلق المحدد
ثم يخرج؛ أعد تشغيل أمر الموافقة باستخدام معرّف الطلب الدقيق بعد التحقق من
التفاصيل.

ملاحظة: إذا أعاد جهاز محاولة الاقتران مع تفاصيل تفويض متغيرة (الدور/النطاقات/المفتاح
العام)، فإن OpenClaw يستبدل الإدخال المعلق السابق ويصدر
`requestId` جديدًا. شغّل `openclaw devices list` مباشرة قبل الموافقة لاستخدام
المعرّف الحالي.

إذا كان الجهاز مقترنًا بالفعل وطلب نطاقات أوسع أو دورًا أوسع،
فإن OpenClaw يُبقي الموافقة الحالية كما هي وينشئ طلب ترقية معلقًا جديدًا.
راجع عمودي `Requested` و`Approved` في `openclaw devices list`
أو استخدم `openclaw devices approve --latest` لمعاينة الترقية الدقيقة قبل
الموافقة عليها.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

ارفض طلب اقتران جهاز معلق.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

دوّر رمز جهاز مميزًا لدور محدد (مع تحديث النطاقات اختياريًا).
يجب أن يكون الدور المستهدف موجودًا بالفعل في عقد الاقتران الموافق عليه لذلك الجهاز؛
ولا يمكن لعملية التدوير سكّ دور جديد غير موافَق عليه.
إذا حذفت `--scope`، فإن عمليات إعادة الاتصال اللاحقة باستخدام الرمز المميز المدور
المخزن تعيد استخدام النطاقات الموافق عليها والمخزنة مؤقتًا لذلك الرمز.
إذا مررت قيم `--scope` صريحة، فإنها تصبح مجموعة النطاقات المخزنة
لعمليات إعادة الاتصال المستقبلية للرمز المميز المخزن مؤقتًا.
لا يمكن للجهات غير الإدارية من الأجهزة المقترنة تدوير سوى **رمز جهازها الخاص**.
كما يجب أن تبقى أي قيم `--scope` صريحة ضمن نطاقات
المشغّل الخاصة بجلسة المستدعي نفسها؛ ولا يمكن لعملية التدوير سكّ رمز مشغّل أوسع
من الذي يملكه المستدعي بالفعل.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

يعيد حمولة الرمز المميز الجديد بصيغة JSON.

### `openclaw devices revoke --device <id> --role <role>`

ألغِ رمز جهاز مميزًا لدور محدد.

لا يمكن للجهات غير الإدارية من الأجهزة المقترنة إلغاء سوى **رمز جهازها الخاص**.
ويتطلب إلغاء رمز جهاز آخر الصلاحية `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

يعيد نتيجة الإلغاء بصيغة JSON.

## الخيارات الشائعة

- `--url <url>`: عنوان WebSocket الخاص بـ Gateway (يستخدم افتراضيًا `gateway.remote.url` عند إعداده).
- `--token <token>`: رمز Gateway المميز (إذا كان مطلوبًا).
- `--password <password>`: كلمة مرور Gateway (تفويض كلمة المرور).
- `--timeout <ms>`: مهلة RPC.
- `--json`: إخراج JSON (موصى به للبرمجة النصية).

ملاحظة: عند تعيين `--url`، لا يعود CLI إلى بيانات اعتماد الإعدادات أو البيئة.
مرر `--token` أو `--password` صراحةً. ويُعد غياب بيانات الاعتماد الصريحة خطأً.

## ملاحظات

- تعيد عملية تدوير الرمز المميز رمزًا جديدًا (حساسًا). تعامل معه كسِر.
- تتطلب هذه الأوامر النطاق `operator.pairing` (أو `operator.admin`).
- تبقى عملية تدوير الرمز المميز ضمن مجموعة أدوار الاقتران الموافق عليها وخط
  الأساس الموافق عليه للنطاقات لذلك الجهاز. لا يمنح إدخال رمز مميز مخزن مؤقتًا
  بالخطأ هدف تدوير جديدًا.
- بالنسبة إلى جلسات رموز الأجهزة المقترنة، تكون الإدارة عبر الأجهزة الأخرى
  للإداريين فقط: تكون `remove` و`rotate` و`revoke` خاصة بالجهاز نفسه فقط
  ما لم يكن لدى المستدعي `operator.admin`.
- تم تقييد `devices clear` عمدًا بـ `--yes`.
- إذا لم يكن نطاق الاقتران متاحًا على local loopback (ولم يتم تمرير `--url` صراحةً)، يمكن للأمرين list/approve استخدام احتياط اقتران محلي.
- يتطلب `devices approve` معرّف طلب صريحًا قبل سكّ الرموز المميزة؛ يؤدي حذف `requestId` أو تمرير `--latest` إلى المعاينة فقط لأحدث طلب معلق.

## قائمة التحقق من استعادة انجراف الرمز المميز

استخدم هذا عندما تستمر واجهة Control UI أو العملاء الآخرون في الفشل مع `AUTH_TOKEN_MISMATCH` أو `AUTH_DEVICE_TOKEN_MISMATCH`.

1. أكّد مصدر رمز Gateway المميز الحالي:

```bash
openclaw config get gateway.auth.token
```

2. اعرض الأجهزة المقترنة وحدد معرّف الجهاز المتأثر:

```bash
openclaw devices list
```

3. دوّر رمز المشغّل للجهاز المتأثر:

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

- تكون أولوية تفويض إعادة الاتصال العادي هي الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المميز المخزن، ثم رمز bootstrap المميز.
- يمكن لاستعادة `AUTH_TOKEN_MISMATCH` الموثوقة أن ترسل مؤقتًا كلًا من الرمز المشترك ورمز الجهاز المميز المخزن معًا من أجل محاولة إعادة واحدة مقيّدة.

ذو صلة:

- [استكشاف أخطاء تفويض Dashboard وإصلاحها](/ar/web/dashboard#if-you-see-unauthorized-1008)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#dashboard-control-ui-connectivity)
