---
read_when:
    - إعداد Zalo الشخصي لـ OpenClaw
    - تصحيح أخطاء تسجيل الدخول أو تدفق الرسائل في Zalo الشخصي
summary: دعم الحساب الشخصي في Zalo عبر zca-js الأصلي (تسجيل الدخول عبر QR)، والإمكانات، والتهيئة
title: Zalo الشخصي
x-i18n:
    generated_at: "2026-04-25T13:42:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

الحالة: تجريبي. يقوم هذا التكامل بأتمتة **حساب Zalo شخصي** عبر `zca-js` الأصلي داخل OpenClaw.

> **تحذير:** هذا تكامل غير رسمي وقد يؤدي إلى تعليق/حظر الحساب. استخدمه على مسؤوليتك الخاصة.

## Plugin مضمّن

يأتي Zalo الشخصي كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذا لا تحتاج الإصدارات المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Zalo الشخصي،
فثبّته يدويًا:

- ثبّت عبر CLI: `openclaw plugins install @openclaw/zalouser`
- أو من نسخة المصدر: `openclaw plugins install ./path/to/local/zalouser-plugin`
- التفاصيل: [Plugins](/ar/tools/plugin)

لا يلزم أي ملف تنفيذي خارجي لـ `zca`/`openzca` CLI.

## إعداد سريع (للمبتدئين)

1. تأكد من توفر Plugin الخاص بـ Zalo الشخصي.
   - تتضمنه بالفعل إصدارات OpenClaw المعبأة الحالية.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. سجّل الدخول (QR، على جهاز Gateway):
   - `openclaw channels login --channel zalouser`
   - امسح رمز QR باستخدام تطبيق Zalo على الهاتف.
3. فعّل القناة:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. أعد تشغيل Gateway (أو أكمل الإعداد).
5. يكون الوصول إلى الرسائل الخاصة مضبوطًا افتراضيًا على الاقتران؛ وافق على رمز الاقتران عند أول تواصل.

## ما هو

- يعمل بالكامل داخل العملية عبر `zca-js`.
- يستخدم مستمعي أحداث أصليين لتلقي الرسائل الواردة.
- يرسل الردود مباشرة عبر JS API (نص/وسائط/رابط).
- مصمم لحالات استخدام “الحساب الشخصي” حيث لا تكون Zalo Bot API متاحة.

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذا يؤتمت **حساب مستخدم Zalo شخصي** (غير رسمي). ونحتفظ بالاسم `zalo` محجوزًا لتكامل رسمي محتمل مع Zalo API في المستقبل.

## العثور على المعرّفات (الدليل)

استخدم CLI الخاص بالدليل لاكتشاف الأقران/المجموعات ومعرّفاتهم:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## الحدود

- يُقسّم النص الصادر إلى أجزاء بحجم ~2000 حرف (بسبب حدود عميل Zalo).
- يكون البث معطّلًا افتراضيًا.

## التحكم في الوصول (الرسائل الخاصة)

يدعم `channels.zalouser.dmPolicy` القيم التالية: `pairing | allowlist | open | disabled` (الافتراضي: `pairing`).

يقبل `channels.zalouser.allowFrom` معرّفات المستخدمين أو الأسماء. أثناء الإعداد، تُحوَّل الأسماء إلى معرّفات باستخدام بحث جهات الاتصال داخل العملية الخاص بـ Plugin.

وافِق عبر:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## الوصول إلى المجموعات (اختياري)

- الافتراضي: `channels.zalouser.groupPolicy = "open"` (المجموعات مسموح بها). استخدم `channels.defaults.groupPolicy` لتجاوز القيمة الافتراضية عند عدم تعيينها.
- لتقييد الوصول إلى قائمة سماح:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (يجب أن تكون المفاتيح معرّفات مجموعات ثابتة؛ وتُحوَّل الأسماء إلى معرّفات عند بدء التشغيل متى أمكن)
  - `channels.zalouser.groupAllowFrom` (يتحكم في المرسلين داخل المجموعات المسموح بها الذين يمكنهم تفعيل الروبوت)
- لحظر جميع المجموعات: `channels.zalouser.groupPolicy = "disabled"`.
- يمكن لمعالج التهيئة أن يطلب قوائم سماح للمجموعات.
- عند بدء التشغيل، يحوّل OpenClaw أسماء المجموعات/المستخدمين في قوائم السماح إلى معرّفات ويسجل هذا الربط.
- يكون تطابق قائمة سماح المجموعات مبنيًا على المعرّفات فقط افتراضيًا. ويتم تجاهل الأسماء غير المحلولة للمصادقة ما لم يتم تمكين `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` هو وضع توافق طارئ يعيد تمكين المطابقة وفق أسماء المجموعات القابلة للتغيير.
- إذا لم يتم تعيين `groupAllowFrom`، فإن بيئة التشغيل تعود إلى `allowFrom` لفحوصات مرسلي المجموعات.
- تنطبق فحوصات المرسل على رسائل المجموعات العادية وأوامر التحكم معًا (مثل `/new` و`/reset`).

مثال:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### حجب الإشارات في المجموعات

- يتحكم `channels.zalouser.groups.<group>.requireMention` في ما إذا كانت الردود في المجموعات تتطلب إشارة.
- ترتيب التحليل: معرّف/اسم مجموعة مطابق تمامًا -> slug مُطبّع للمجموعة -> `*` -> الافتراضي (`true`).
- ينطبق هذا على المجموعات المدرجة في قائمة السماح ووضع المجموعات المفتوح.
- يُعد اقتباس رسالة من الروبوت إشارة ضمنية لتفعيل المجموعة.
- يمكن لأوامر التحكم المصرح بها (مثل `/new`) تجاوز حجب الإشارات.
- عندما يتم تخطي رسالة مجموعة بسبب اشتراط الإشارة، يخزنها OpenClaw كسجل مجموعة معلّق ويضمّنها في رسالة المجموعة التالية التي تتم معالجتها.
- يكون الحد الافتراضي لسجل المجموعات هو `messages.groupChat.historyLimit` (مع fallback يساوي `50`). ويمكنك تجاوزه لكل حساب باستخدام `channels.zalouser.historyLimit`.

مثال:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## حسابات متعددة

تُربط الحسابات بملفات تعريف `zalouser` في حالة OpenClaw. مثال:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## الكتابة والتفاعلات وتأكيدات التسليم

- يرسل OpenClaw حدث كتابة قبل إرسال الرد (بأفضل جهد).
- الإجراء `react` الخاص بتفاعلات الرسائل مدعوم لـ `zalouser` ضمن إجراءات القنوات.
  - استخدم `remove: true` لإزالة emoji تفاعل محددة من رسالة.
  - دلالات التفاعل: [التفاعلات](/ar/tools/reactions)
- بالنسبة إلى الرسائل الواردة التي تتضمن بيانات وصفية للحدث، يرسل OpenClaw تأكيدات التسليم + المشاهدة (بأفضل جهد).

## استكشاف الأخطاء وإصلاحها

**تسجيل الدخول لا يستمر:**

- `openclaw channels status --probe`
- أعد تسجيل الدخول: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**لم يتم تحليل اسم قائمة السماح/المجموعة:**

- استخدم المعرّفات الرقمية في `allowFrom`/`groupAllowFrom`/`groups`، أو أسماء الأصدقاء/المجموعات المطابقة تمامًا.

**تمت الترقية من إعداد قديم يعتمد على CLI:**

- أزل أي افتراضات قديمة حول عملية `zca` خارجية.
- تعمل القناة الآن بالكامل داخل OpenClaw من دون أي ملفات CLI تنفيذية خارجية.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشات المجموعات وحجب الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
