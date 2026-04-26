---
read_when:
    - تريد إضافة/إزالة حسابات القنوات (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - تريد التحقق من حالة القناة أو تتبّع سجلات القناة مباشرةً
summary: مرجع CLI لـ `openclaw channels` (الحسابات، الحالة، تسجيل الدخول/تسجيل الخروج، السجلات)
title: القنوات
x-i18n:
    generated_at: "2026-04-26T12:24:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

إدارة حسابات قنوات الدردشة وحالة تشغيلها على Gateway.

المستندات ذات الصلة:

- أدلة القنوات: [القنوات](/ar/channels/index)
- إعدادات Gateway: [الإعدادات](/ar/gateway/configuration)

## الأوامر الشائعة

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## الحالة / الإمكانات / التحويل / السجلات

- `channels status`: ‏`--probe`، ‏`--timeout <ms>`، ‏`--json`
- `channels capabilities`: ‏`--channel <name>`، ‏`--account <id>` (فقط مع `--channel`)، ‏`--target <dest>`، ‏`--timeout <ms>`، ‏`--json`
- `channels resolve`: ‏`<entries...>`، ‏`--channel <name>`، ‏`--account <id>`، ‏`--kind <auto|user|group>`، ‏`--json`
- `channels logs`: ‏`--channel <name|all>`، ‏`--lines <n>`، ‏`--json`

المسار الحي لـ `channels status --probe` هو: عند الوصول إلى Gateway، فإنه يشغّل فحوصات `probeAccount` لكل حساب وفحوصات `auditAccount` الاختيارية، لذلك قد يتضمن الإخراج حالة النقل بالإضافة إلى نتائج الفحص مثل `works` و`probe failed` و`audit ok` و`audit failed`.
إذا تعذر الوصول إلى Gateway، فإن `channels status` يعود إلى ملخصات تعتمد على الإعدادات فقط بدلًا من إخراج الفحص الحي.

## إضافة / إزالة الحسابات

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

نصيحة: يعرض `openclaw channels add --help` العلامات الخاصة بكل قناة (الرمز المميز، المفتاح الخاص، رمز التطبيق، مسارات signal-cli، وغير ذلك).

تشمل أسطح الإضافة الشائعة غير التفاعلية ما يلي:

- قنوات bot-token: ‏`--token`، ‏`--bot-token`، ‏`--app-token`، ‏`--token-file`
- حقول النقل الخاصة بـ Signal/iMessage: ‏`--signal-number`، ‏`--cli-path`، ‏`--http-url`، ‏`--http-host`، ‏`--http-port`، ‏`--db-path`، ‏`--service`، ‏`--region`
- حقول Google Chat: ‏`--webhook-path`، ‏`--webhook-url`، ‏`--audience-type`، ‏`--audience`
- حقول Matrix: ‏`--homeserver`، ‏`--user-id`، ‏`--access-token`، ‏`--password`، ‏`--device-name`، ‏`--initial-sync-limit`
- حقول Nostr: ‏`--private-key`، ‏`--relay-urls`
- حقول Tlon: ‏`--ship`، ‏`--url`، ‏`--code`، ‏`--group-channels`، ‏`--dm-allowlist`، ‏`--auto-discover-channels`
- ‏`--use-env` للمصادقة المعتمدة على متغيرات البيئة للحساب الافتراضي حيثما كان ذلك مدعومًا

إذا كان يلزم تثبيت Plugin قناة أثناء أمر إضافة يعتمد على العلامات، فإن OpenClaw يستخدم مصدر التثبيت الافتراضي للقناة دون فتح مطالبة تثبيت Plugin التفاعلية.

عند تشغيل `openclaw channels add` بدون علامات، يمكن أن يطلب منك المعالج التفاعلي ما يلي:

- معرّفات الحسابات لكل قناة محددة
- أسماء عرض اختيارية لتلك الحسابات
- ‏`Bind configured channel accounts to agents now?`

إذا أكدت الربط الآن، فسيسأل المعالج أي وكيل يجب أن يملك كل حساب قناة تمت تهيئته، ثم يكتب ارتباطات توجيه على مستوى الحساب.

يمكنك أيضًا إدارة قواعد التوجيه نفسها لاحقًا باستخدام `openclaw agents bindings` و`openclaw agents bind` و`openclaw agents unbind` (راجع [agents](/ar/cli/agents)).

عند إضافة حساب غير افتراضي إلى قناة ما تزال تستخدم إعدادات المستوى الأعلى للحساب الواحد، يقوم OpenClaw بترقية قيم المستوى الأعلى ذات النطاق الخاص بالحساب إلى خريطة حسابات القناة قبل كتابة الحساب الجديد. تضع معظم القنوات هذه القيم في `channels.<channel>.accounts.default`، لكن يمكن للقنوات المضمنة الاحتفاظ بحساب مُرقّى مطابق موجود بالفعل بدلًا من ذلك. Matrix هو المثال الحالي: إذا كان هناك حساب مُسمى واحد موجود بالفعل، أو إذا كانت `defaultAccount` تشير إلى حساب مُسمى موجود، فإن الترقية تحتفظ بذلك الحساب بدلًا من إنشاء `accounts.default` جديد.

يبقى سلوك التوجيه متسقًا:

- تستمر الارتباطات الحالية الخاصة بالقناة فقط (من دون `accountId`) في مطابقة الحساب الافتراضي.
- لا يقوم `channels add` بإنشاء الارتباطات تلقائيًا أو إعادة كتابتها في الوضع غير التفاعلي.
- يمكن للإعداد التفاعلي إضافة ارتباطات ذات نطاق على مستوى الحساب اختياريًا.

إذا كان إعدادك بالفعل في حالة مختلطة (وجود حسابات مُسماة مع بقاء قيم المستوى الأعلى للحساب الواحد مضبوطة)، فشغّل `openclaw doctor --fix` لنقل القيم ذات النطاق على مستوى الحساب إلى الحساب المُرقّى المختار لتلك القناة. تقوم معظم القنوات بالترقية إلى `accounts.default`؛ ويمكن لـ Matrix الاحتفاظ بهدف مُسمى/افتراضي موجود بدلًا من ذلك.

## تسجيل الدخول / تسجيل الخروج (تفاعلي)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

ملاحظات:

- يدعم `channels login` الخيار `--verbose`.
- يمكن لكل من `channels login` و`logout` استنتاج القناة عندما يكون هناك هدف تسجيل دخول مدعوم واحد فقط مُهيأ.

## استكشاف الأخطاء وإصلاحها

- شغّل `openclaw status --deep` لإجراء فحص واسع.
- استخدم `openclaw doctor` للحصول على إصلاحات موجّهة.
- يعرض `openclaw channels list` ‏`Claude: HTTP 403 ... user:profile` ← تتطلب لقطة الاستخدام النطاق `user:profile`. استخدم `--no-usage`، أو قدّم مفتاح جلسة claude.ai (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`)، أو أعد المصادقة عبر Claude CLI.
- يعود `openclaw channels status` إلى ملخصات تعتمد على الإعدادات فقط عندما يتعذر الوصول إلى Gateway. إذا تم تهيئة بيانات اعتماد قناة مدعومة عبر SecretRef ولكنها غير متاحة في مسار الأمر الحالي، فإنه يبلغ عن ذلك الحساب على أنه مُهيأ مع ملاحظات حالة متدهورة بدلًا من إظهاره على أنه غير مُهيأ.

## فحص الإمكانات

يجلب تلميحات إمكانات المزوّد (intents/scopes حيثما كانت متاحة) بالإضافة إلى دعم الميزات الثابتة:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

ملاحظات:

- الخيار `--channel` اختياري؛ احذفه لإدراج كل قناة (بما في ذلك الامتدادات).
- يكون `--account` صالحًا فقط مع `--channel`.
- يقبل `--target` القيمة `channel:<id>` أو معرّف قناة رقميًا خامًا، وينطبق فقط على Discord.
- الفحوصات خاصة بكل مزوّد: Discord intents مع أذونات القناة الاختيارية؛ وSlack bot مع user scopes؛ وTelegram bot flags مع Webhook؛ وإصدار Signal daemon؛ وMicrosoft Teams app token مع Graph roles/scopes (مع الإشارة إليها حيثما كانت معروفة). تبلغ القنوات التي لا تحتوي على فحوصات عن `Probe: unavailable`.

## تحويل الأسماء إلى معرّفات

يمكنك تحويل أسماء القنوات/المستخدمين إلى معرّفات باستخدام دليل المزوّد:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

ملاحظات:

- استخدم `--kind user|group|auto` لفرض نوع الهدف.
- يفضّل التحويل المطابقات النشطة عندما تشترك عدة إدخالات في الاسم نفسه.
- الأمر `channels resolve` للقراءة فقط. إذا تم تهيئة الحساب المحدد عبر SecretRef ولكن بيانات الاعتماد تلك غير متاحة في مسار الأمر الحالي، فسيُرجع الأمر نتائج غير محلولة متدهورة مع ملاحظات بدلًا من إيقاف التشغيل بالكامل.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على القنوات](/ar/channels)
