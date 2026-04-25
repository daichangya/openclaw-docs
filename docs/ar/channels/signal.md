---
read_when:
    - إعداد دعم Signal
    - تصحيح أخطاء الإرسال/الاستقبال في Signal
summary: دعم Signal عبر signal-cli ‏(JSON-RPC + SSE)، ومسارات الإعداد، ونموذج الأرقام
title: Signal
x-i18n:
    generated_at: "2026-04-25T13:41:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1ff4328aae73576a78b00be3dd79e9768badfc6193843ed3c05439765ae295
    source_path: channels/signal.md
    workflow: 15
---

الحالة: تكامل CLI خارجي. يتواصل Gateway مع `signal-cli` عبر HTTP JSON-RPC + SSE.

## المتطلبات المسبقة

- تثبيت OpenClaw على خادمك (تم اختبار التدفق أدناه على Ubuntu 24).
- توفر `signal-cli` على المضيف الذي يعمل عليه الـ gateway.
- رقم هاتف يمكنه استقبال رسالة SMS واحدة للتحقق (لمسار التسجيل عبر SMS).
- وصول عبر المتصفح إلى Captcha الخاصة بـ Signal (`signalcaptchas.org`) أثناء التسجيل.

## الإعداد السريع (للمبتدئين)

1. استخدم **رقم Signal منفصلًا** للروبوت (موصى به).
2. ثبّت `signal-cli` (يلزم Java إذا كنت تستخدم إصدار JVM).
3. اختر أحد مساري الإعداد:
   - **المسار A (ربط QR):** `signal-cli link -n "OpenClaw"` ثم امسح الرمز باستخدام Signal.
   - **المسار B (تسجيل SMS):** سجّل رقمًا مخصصًا باستخدام captcha + التحقق عبر SMS.
4. هيّئ OpenClaw وأعد تشغيل Gateway.
5. أرسل أول رسالة مباشرة ووافق على الاقتران (`openclaw pairing approve signal <CODE>`).

الحد الأدنى من الإعداد:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

مرجع الحقول:

| الحقل       | الوصف                                                |
| ----------- | ---------------------------------------------------- |
| `account`   | رقم هاتف الروبوت بتنسيق E.164 (`+15551234567`)       |
| `cliPath`   | مسار `signal-cli` (`signal-cli` إذا كان على `PATH`)  |
| `dmPolicy`  | سياسة الوصول للرسائل المباشرة (`pairing` موصى بها)   |
| `allowFrom` | أرقام الهواتف أو قيم `uuid:<id>` المسموح لها بمراسلة مباشرة |

## ما هو

- قناة Signal عبر `signal-cli` (وليس libsignal مضمّنًا).
- توجيه حتمي: تعود الردود دائمًا إلى Signal.
- تشارك الرسائل المباشرة الجلسة الرئيسية للوكيل؛ أما المجموعات فهي معزولة (`agent:<agentId>:signal:group:<groupId>`).

## عمليات الكتابة إلى الإعداد

افتراضيًا، يُسمح لـ Signal بكتابة تحديثات الإعداد التي يتم تشغيلها بواسطة `/config set|unset` (يتطلب `commands.config: true`).

عطّل ذلك باستخدام:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## نموذج الأرقام (مهم)

- يتصل gateway بـ **جهاز Signal** (حساب `signal-cli`).
- إذا شغّلت الروبوت على **حساب Signal الشخصي الخاص بك**، فسيتجاهل رسائلك أنت (حماية من الحلقات).
- في حالة "أراسل الروبوت فيرد عليّ"، استخدم **رقم روبوت منفصلًا**.

## مسار الإعداد A: ربط حساب Signal موجود (QR)

1. ثبّت `signal-cli` (إصدار JVM أو الإصدار الأصلي).
2. اربط حساب روبوت:
   - `signal-cli link -n "OpenClaw"` ثم امسح رمز QR في Signal.
3. هيّئ Signal وابدأ Gateway.

مثال:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

دعم الحسابات المتعددة: استخدم `channels.signal.accounts` مع إعداد خاص بكل حساب و`name` اختياري. راجع [`gateway/configuration`](/ar/gateway/config-channels#multi-account-all-channels) للاطلاع على النمط المشترك.

## مسار الإعداد B: تسجيل رقم روبوت مخصص (SMS، Linux)

استخدم هذا المسار عندما تريد رقم روبوت مخصصًا بدلًا من ربط حساب تطبيق Signal موجود.

1. احصل على رقم يمكنه استقبال رسائل SMS (أو التحقق الصوتي للهواتف الأرضية).
   - استخدم رقم روبوت مخصصًا لتجنب تعارضات الحساب/الجلسة.
2. ثبّت `signal-cli` على مضيف الـ gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

إذا كنت تستخدم إصدار JVM (`signal-cli-${VERSION}.tar.gz`)، فثبّت JRE 25+ أولًا.
حافظ على تحديث `signal-cli`؛ إذ تشير ملاحظات المصدر إلى أن الإصدارات القديمة قد تتعطل مع تغيّر واجهات Signal server API.

3. سجّل الرقم وأكّد التحقق منه:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

إذا كانت captcha مطلوبة:

1. افتح `https://signalcaptchas.org/registration/generate.html`.
2. أكمل captcha، ثم انسخ هدف رابط `signalcaptcha://...` من "Open Signal".
3. شغّل الأمر من عنوان IP الخارجي نفسه لجلسة المتصفح إن أمكن.
4. شغّل التسجيل مرة أخرى فورًا (تنتهي صلاحية رموز captcha بسرعة):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. هيّئ OpenClaw، وأعد تشغيل gateway، وتحقق من القناة:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. قم باقتران مُرسِل الرسائل المباشرة:
   - أرسل أي رسالة إلى رقم الروبوت.
   - وافق على الرمز على الخادم: `openclaw pairing approve signal <PAIRING_CODE>`.
   - احفظ رقم الروبوت كجهة اتصال على هاتفك لتجنب ظهور "Unknown contact".

مهم: قد يؤدي تسجيل حساب رقم هاتف باستخدام `signal-cli` إلى إلغاء توثيق جلسة تطبيق Signal الرئيسية لذلك الرقم. يُفضّل استخدام رقم روبوت مخصص، أو استخدام وضع الربط عبر QR إذا كنت تحتاج إلى الاحتفاظ بإعداد تطبيق الهاتف الحالي.

مراجع المصدر:

- ملف `signal-cli` README: `https://github.com/AsamK/signal-cli`
- تدفق captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- تدفق الربط: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## وضع daemon الخارجي (httpUrl)

إذا كنت تريد إدارة `signal-cli` بنفسك (بدء JVM البارد البطيء، أو تهيئة الحاويات، أو وحدات CPU المشتركة)، فشغّل daemon بشكل منفصل ووجّه OpenClaw إليه:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

يتجاوز هذا التشغيل التلقائي والانتظار عند بدء التشغيل داخل OpenClaw. بالنسبة إلى حالات البدء البطيء عند التشغيل التلقائي، اضبط `channels.signal.startupTimeoutMs`.

## التحكم في الوصول (الرسائل المباشرة + المجموعات)

الرسائل المباشرة:

- الافتراضي: `channels.signal.dmPolicy = "pairing"`.
- يتلقى المرسلون غير المعروفين رمز اقتران؛ ويتم تجاهل الرسائل إلى أن تتم الموافقة عليهم (تنتهي صلاحية الرموز بعد ساعة واحدة).
- يمكن الموافقة عبر:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- الاقتران هو آلية تبادل الرموز الافتراضية للرسائل المباشرة في Signal. التفاصيل: [الاقتران](/ar/channels/pairing)
- يتم تخزين المرسلين الذين لديهم UUID فقط (من `sourceUuid`) كـ `uuid:<id>` في `channels.signal.allowFrom`.

المجموعات:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- يتحكم `channels.signal.groupAllowFrom` في من يمكنه التشغيل في المجموعات عندما يكون `allowlist` مضبوطًا.
- يمكن لـ `channels.signal.groups["<group-id>" | "*"]` تجاوز سلوك المجموعات باستخدام `requireMention` و`tools` و`toolsBySender`.
- استخدم `channels.signal.accounts.<id>.groups` للتجاوزات الخاصة بكل حساب في إعدادات الحسابات المتعددة.
- ملاحظة وقت التشغيل: إذا كان `channels.signal` مفقودًا تمامًا، يعود وقت التشغيل إلى `groupPolicy="allowlist"` لفحوصات المجموعات (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

## كيف يعمل (السلوك)

- يعمل `signal-cli` كـ daemon؛ ويقرأ gateway الأحداث عبر SSE.
- يتم توحيد الرسائل الواردة في غلاف القناة المشترك.
- تُوجَّه الردود دائمًا إلى الرقم نفسه أو المجموعة نفسها.

## الوسائط + الحدود

- يتم تقسيم النص الصادر إلى أجزاء وفق `channels.signal.textChunkLimit` (الافتراضي 4000).
- تقسيم اختياري حسب الأسطر الجديدة: اضبط `channels.signal.chunkMode="newline"` للتقسيم على الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- المرفقات مدعومة (base64 يتم جلبه من `signal-cli`).
- تستخدم مرفقات الملاحظات الصوتية اسم ملف `signal-cli` كبديل MIME عندما يكون `contentType` مفقودًا، بحيث يظل بإمكان تفريغ الصوت تصنيف مذكرات AAC الصوتية.
- الحد الافتراضي للوسائط: `channels.signal.mediaMaxMb` (الافتراضي 8).
- استخدم `channels.signal.ignoreAttachments` لتخطي تنزيل الوسائط.
- يستخدم سياق سجل المجموعات `channels.signal.historyLimit` (أو `channels.signal.accounts.*.historyLimit`) مع الرجوع إلى `messages.groupChat.historyLimit`. اضبط القيمة `0` للتعطيل (الافتراضي 50).

## مؤشرات الكتابة + إيصالات القراءة

- **مؤشرات الكتابة**: يرسل OpenClaw إشارات الكتابة عبر `signal-cli sendTyping` ويحدّثها أثناء تشغيل الرد.
- **إيصالات القراءة**: عندما تكون `channels.signal.sendReadReceipts` مساوية لـ true، يمرّر OpenClaw إيصالات القراءة للرسائل المباشرة المسموح بها.
- لا يوفّر Signal-cli إيصالات قراءة للمجموعات.

## التفاعلات (أداة الرسائل)

- استخدم `message action=react` مع `channel=signal`.
- الأهداف: مرسل E.164 أو UUID (استخدم `uuid:<id>` من خرج الاقتران؛ كما يعمل UUID المجرد أيضًا).
- `messageId` هو الطابع الزمني في Signal للرسالة التي تتفاعل معها.
- تتطلب تفاعلات المجموعات `targetAuthor` أو `targetAuthorUuid`.

أمثلة:

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

الإعداد:

- `channels.signal.actions.reactions`: تمكين/تعطيل إجراءات التفاعل (الافتراضي true).
- `channels.signal.reactionLevel`: ‏`off | ack | minimal | extensive`.
  - يعطّل `off`/`ack` تفاعلات الوكيل (وسيفشل `react` في أداة الرسائل).
  - يفعّل `minimal`/`extensive` تفاعلات الوكيل ويضبط مستوى الإرشاد.
- التجاوزات لكل حساب: `channels.signal.accounts.<id>.actions.reactions` و`channels.signal.accounts.<id>.reactionLevel`.

## أهداف التسليم (CLI/Cron)

- الرسائل المباشرة: `signal:+15551234567` (أو E.164 عادي).
- الرسائل المباشرة عبر UUID: ‏`uuid:<id>` (أو UUID مجرد).
- المجموعات: `signal:group:<groupId>`.
- أسماء المستخدمين: `username:<name>` (إذا كان حساب Signal لديك يدعم ذلك).

## استكشاف الأخطاء وإصلاحها

شغّل هذا التسلسل أولًا:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

ثم أكد حالة اقتران الرسائل المباشرة عند الحاجة:

```bash
openclaw pairing list signal
```

الأعطال الشائعة:

- يمكن الوصول إلى daemon لكن لا توجد ردود: تحقق من إعدادات الحساب/daemon (`httpUrl`, `account`) ووضع الاستقبال.
- يتم تجاهل الرسائل المباشرة: المرسل بانتظار الموافقة على الاقتران.
- يتم تجاهل رسائل المجموعات: تمنع بوابة المرسل/الإشارة في المجموعة التسليم.
- أخطاء التحقق من الإعداد بعد التعديلات: شغّل `openclaw doctor --fix`.
- عدم ظهور Signal في التشخيصات: تأكد من `channels.signal.enabled: true`.

فحوصات إضافية:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

لتدفق الفرز: [/channels/troubleshooting](/ar/channels/troubleshooting).

## ملاحظات الأمان

- يخزن `signal-cli` مفاتيح الحساب محليًا (عادةً في `~/.local/share/signal-cli/data/`).
- انسخ حالة حساب Signal احتياطيًا قبل ترحيل الخادم أو إعادة بنائه.
- أبقِ `channels.signal.dmPolicy: "pairing"` ما لم تكن تريد صراحةً وصولًا أوسع إلى الرسائل المباشرة.
- يلزم التحقق عبر SMS فقط للتسجيل أو مسارات الاسترداد، لكن فقدان السيطرة على الرقم/الحساب قد يعقّد إعادة التسجيل.

## مرجع الإعداد (Signal)

الإعداد الكامل: [الإعداد](/ar/gateway/configuration)

خيارات الموفّر:

- `channels.signal.enabled`: تمكين/تعطيل بدء تشغيل القناة.
- `channels.signal.account`: تنسيق E.164 لحساب الروبوت.
- `channels.signal.cliPath`: مسار `signal-cli`.
- `channels.signal.httpUrl`: عنوان URL الكامل للـ daemon (يتجاوز host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: ربط الـ daemon (الافتراضي 127.0.0.1:8080).
- `channels.signal.autoStart`: تشغيل الـ daemon تلقائيًا (الافتراضي true إذا لم يتم ضبط `httpUrl`).
- `channels.signal.startupTimeoutMs`: مهلة انتظار بدء التشغيل بالمللي ثانية (الحد الأقصى 120000).
- `channels.signal.receiveMode`: ‏`on-start | manual`.
- `channels.signal.ignoreAttachments`: تخطي تنزيلات المرفقات.
- `channels.signal.ignoreStories`: تجاهل القصص من الـ daemon.
- `channels.signal.sendReadReceipts`: تمرير إيصالات القراءة.
- `channels.signal.dmPolicy`: ‏`pairing | allowlist | open | disabled` (الافتراضي: pairing).
- `channels.signal.allowFrom`: قائمة السماح للرسائل المباشرة (E.164 أو `uuid:<id>`). يتطلب `open` القيمة `"*"`. لا يدعم Signal أسماء المستخدمين؛ استخدم معرّفات الهاتف/UUID.
- `channels.signal.groupPolicy`: ‏`open | allowlist | disabled` (الافتراضي: allowlist).
- `channels.signal.groupAllowFrom`: قائمة السماح لمرسلي المجموعات.
- `channels.signal.groups`: تجاوزات لكل مجموعة مفهرسة بحسب معرّف مجموعة Signal (أو `"*"`). الحقول المدعومة: `requireMention` و`tools` و`toolsBySender`.
- `channels.signal.accounts.<id>.groups`: النسخة الخاصة بكل حساب من `channels.signal.groups` لإعدادات الحسابات المتعددة.
- `channels.signal.historyLimit`: الحد الأقصى لرسائل المجموعات التي تُضمَّن كسياق (القيمة 0 تعطلها).
- `channels.signal.dmHistoryLimit`: حد سجل الرسائل المباشرة بعدد أدوار المستخدم. تجاوزات لكل مستخدم: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: حجم تقسيم الرسائل الصادرة (بالمحارف).
- `channels.signal.chunkMode`: ‏`length` (الافتراضي) أو `newline` للتقسيم على الأسطر الفارغة (حدود الفقرات) قبل التقسيم حسب الطول.
- `channels.signal.mediaMaxMb`: الحد الأقصى للوسائط الواردة/الصادرة (MB).

الخيارات العامة ذات الصلة:

- `agents.list[].groupChat.mentionPatterns` (لا يدعم Signal الإشارات الأصلية).
- `messages.groupChat.mentionPatterns` (البديل العام).
- `messages.responsePrefix`.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
