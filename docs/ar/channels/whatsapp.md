---
read_when:
    - العمل على سلوك قناة WhatsApp/web أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وعناصر التحكم في الوصول، وسلوك التسليم، والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-04-22T04:21:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c527b9f7f58f4bb7272a6d1c0f9a435d7d46a9b99790243594afb5c305606b3
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (قناة الويب)

الحالة: جاهز للإنتاج عبر WhatsApp Web ‏(Baileys). يتولى Gateway الجلسات المرتبطة.

## التثبيت (عند الطلب)

- يقوم كل من (`openclaw onboard`) و`openclaw channels add --channel whatsapp`
  بعرض مطالبة لتثبيت plugin الخاص بـ WhatsApp في أول مرة تختاره فيها.
- كما يوفّر `openclaw channels login --channel whatsapp` تدفق التثبيت عندما
  لا يكون plugin موجودًا بعد.
- قناة التطوير + نسخة git المحلية: يكون الافتراضي هو مسار plugin المحلي.
- Stable/Beta: يكون الافتراضي هو حزمة npm ‏`@openclaw/whatsapp`.

يبقى التثبيت اليدوي متاحًا:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    السياسة الافتراضية للرسائل المباشرة هي الاقتران للمرسلين غير المعروفين.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    أدوات تشخيص مشتركة بين القنوات وأدلة إصلاح.
  </Card>
  <Card title="تكوين Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة كاملة لتكوين القنوات.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="تكوين سياسة الوصول إلى WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="ربط WhatsApp ‏(QR)">

```bash
openclaw channels login --channel whatsapp
```

    لحساب محدد:

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="بدء Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="الموافقة على أول طلب اقتران (إذا كنت تستخدم وضع الاقتران)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة. ويُحدَّد الحد الأقصى للطلبات المعلقة بثلاثة لكل قناة.

  </Step>
</Steps>

<Note>
يوصي OpenClaw بتشغيل WhatsApp على رقم منفصل كلما أمكن. (تم تحسين بيانات القناة الوصفية وتدفق الإعداد لهذا النمط، لكن إعدادات الرقم الشخصي مدعومة أيضًا.)
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="رقم مخصص (موصى به)">
    هذا هو النمط التشغيلي الأنظف:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - حدود أوضح لقوائم السماح في الرسائل المباشرة والتوجيه
    - احتمال أقل لالتباس الدردشة مع الذات

    نمط الحد الأدنى للسياسة:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="بديل الرقم الشخصي">
    يدعم التدفق الإرشادي وضع الرقم الشخصي ويكتب خط أساس مناسبًا للدردشة مع الذات:

    - `dmPolicy: "allowlist"`
    - تتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    أثناء التشغيل، تعتمد وسائل الحماية الخاصة بالدردشة مع الذات على الرقم الذاتي المرتبط و`allowFrom`.

  </Accordion>

  <Accordion title="نطاق قناة WhatsApp Web فقط">
    قناة منصة المراسلة تعتمد على WhatsApp Web ‏(`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة WhatsApp منفصلة عبر Twilio في سجل قنوات الدردشة المدمج.

  </Accordion>
</AccordionGroup>

## نموذج التشغيل

- يتولى Gateway مقبس WhatsApp وحلقة إعادة الاتصال.
- تتطلب عمليات الإرسال الصادرة مستمع WhatsApp نشطًا للحساب المستهدف.
- يتم تجاهل محادثات الحالة والبث (`@status`, `@broadcast`).
- تستخدم المحادثات المباشرة قواعد جلسات الرسائل المباشرة (`session.dmScope`؛ القيمة الافتراضية `main` تدمج الرسائل المباشرة في الجلسة الرئيسية للوكيل).
- تكون جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يلتزم نقل WhatsApp Web بمتغيرات بيئة الوكيل القياسية على مضيف Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / والنُسخ الصغيرة منها). فضّل تكوين الوكيل على مستوى المضيف بدلًا من إعدادات وكيل WhatsApp الخاصة بالقناة.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى المحادثات المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    تقبل `allowFrom` أرقامًا بنمط E.164 (وتتم تسويتها داخليًا).

    تجاوز الحسابات المتعددة: تأخذ `channels.whatsapp.accounts.<id>.dmPolicy` (و`allowFrom`) الأولوية على الإعدادات الافتراضية على مستوى القناة لذلك الحساب.

    تفاصيل سلوك وقت التشغيل:

    - تُحفَظ عمليات الاقتران في مخزن السماح الخاص بالقناة وتُدمَج مع `allowFrom` المضبوطة
    - إذا لم يتم تكوين أي قائمة سماح، فسيُسمح بالرقم الذاتي المرتبط افتراضيًا
    - لا يتم أبدًا إقران الرسائل المباشرة الصادرة `fromMe` تلقائيًا

  </Tab>

  <Tab title="سياسة المجموعات + قوائم السماح">
    يتكون الوصول إلى المجموعات من طبقتين:

    1. **قائمة سماح عضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا تم حذف `groups`، فجميع المجموعات مؤهلة
       - إذا كانت `groups` موجودة، فإنها تعمل كقائمة سماح للمجموعات (مع السماح بـ `"*"`)

    2. **سياسة مرسل المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: يتم تجاوز قائمة السماح الخاصة بالمرسل
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: حظر جميع الرسائل الواردة من المجموعات

    التراجع في قائمة سماح المرسل:

    - إذا لم يتم ضبط `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` عند توفرها
    - يتم تقييم قوائم سماح المرسل قبل تفعيل الإشارة/الرد

    ملاحظة: إذا لم توجد كتلة `channels.whatsapp` على الإطلاق، فإن التراجع لسياسة المجموعات أثناء التشغيل يكون `allowlist` (مع سجل تحذيري)، حتى إذا كانت `channels.defaults.groupPolicy` مضبوطة.

  </Tab>

  <Tab title="الإشارات + /activation">
    تتطلب الردود في المجموعات الإشارة افتراضيًا.

    يتضمن اكتشاف الإشارة ما يلي:

    - إشارات WhatsApp الصريحة إلى هوية bot
    - أنماط regex المكوّنة للإشارة (`agents.list[].groupChat.mentionPatterns`، مع التراجع إلى `messages.groupChat.mentionPatterns`)
    - اكتشاف الرد الضمني على bot (مطابقة مرسل الرد مع هوية bot)

    ملاحظة أمنية:

    - يفي الاقتباس/الرد فقط بشرط تقييد الإشارة؛ لكنه **لا** يمنح تفويضًا للمرسل
    - عند استخدام `groupPolicy: "allowlist"`، يظل المرسلون غير الموجودين في قائمة السماح محظورين حتى لو ردوا على رسالة من مستخدم موجود في قائمة السماح

    أمر التفعيل على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يحدّث `activation` حالة الجلسة (وليس التكوين العام). وهو مقيّد بالمالك.

  </Tab>
</Tabs>

## سلوك الرقم الشخصي والدردشة مع الذات

عندما يكون الرقم الذاتي المرتبط موجودًا أيضًا في `allowFrom`، يتم تفعيل وسائل الحماية الخاصة بالدردشة مع الذات في WhatsApp:

- تخطي إيصالات القراءة في أدوار الدردشة مع الذات
- تجاهل سلوك التشغيل التلقائي القائم على mention-JID الذي قد يرسل تنبيهًا إلى نفسك
- إذا لم يتم ضبط `messages.responsePrefix`، فستكون ردود الدردشة مع الذات افتراضيًا `[{identity.name}]` أو `[openclaw]`

## تسوية الرسائل والسياق

<AccordionGroup>
  <Accordion title="مغلف الإدخال + سياق الرد">
    تُغلَّف رسائل WhatsApp الواردة في مغلف الإدخال المشترك.

    إذا وُجد رد مقتبس، يُلحَق السياق بهذا الشكل:

    ```text
    [الرد على <sender> id:<stanzaId>]
    <نص مقتبس أو عنصر نائب للوسائط>
    [/الرد]
    ```

    كما تُملأ حقول بيانات وصف الرد عند توفرها (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, ومرسل JID/E.164).

  </Accordion>

  <Accordion title="عناصر الوسائط النائبة واستخراج الموقع/جهة الاتصال">
    تتم تسوية الرسائل الواردة التي تحتوي على وسائط فقط باستخدام عناصر نائبة مثل:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    وتتم تسوية حمولات الموقع وجهة الاتصال إلى سياق نصي قبل التوجيه.

  </Accordion>

  <Accordion title="حقن سجل المجموعة المعلق">
    بالنسبة للمجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتًا وحقنها كسياق عندما يتم تشغيل bot أخيرًا.

    - الحد الافتراضي: `50`
    - التكوين: `channels.whatsapp.historyLimit`
    - التراجع: `messages.groupChat.historyLimit`
    - القيمة `0` تعطل هذا السلوك

    علامات الحقن:

    - `[رسائل الدردشة منذ آخر رد منك - للسياق]`
    - `[الرسالة الحالية - يجب الرد على هذه]`

  </Accordion>

  <Accordion title="إيصالات القراءة">
    تكون إيصالات القراءة مفعّلة افتراضيًا لرسائل WhatsApp الواردة المقبولة.

    للتعطيل على مستوى عام:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    تجاوز لكل حساب:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    تتخطى أدوار الدردشة مع الذات إيصالات القراءة حتى عند تفعيلها على مستوى عام.

  </Accordion>
</AccordionGroup>

## التسليم والتقسيم والوسائط

<AccordionGroup>
  <Accordion title="تقسيم النص">
    - الحد الافتراضي للتقسيم: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى التقسيم الآمن حسب الطول
  </Accordion>

  <Accordion title="سلوك الوسائط الصادرة">
    - يدعم حمولات الصور والفيديو والصوت (ملاحظة صوتية PTT) والمستندات
    - يُعاد كتابة `audio/ogg` إلى `audio/ogg; codecs=opus` لتوافق الملاحظات الصوتية
    - تشغيل GIF المتحرك مدعوم عبر `gifPlayback: true` عند إرسال الفيديو
    - تُطبَّق التسميات التوضيحية على أول عنصر وسائط عند إرسال حمولات رد متعددة الوسائط
    - يمكن أن يكون مصدر الوسائط HTTP(S) أو `file://` أو مسارات محلية
  </Accordion>

  <Accordion title="حدود حجم الوسائط وسلوك التراجع">
    - الحد الأقصى لحفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - الحد الأقصى لإرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - تُحسَّن الصور تلقائيًا (تغيير الحجم/فحص الجودة) لتلائم الحدود
    - عند فشل إرسال الوسائط، يرسل التراجع للعنصر الأول تحذيرًا نصيًا بدلًا من إسقاط الرد بصمت
  </Accordion>
</AccordionGroup>

## مستوى التفاعلات

يتحكم `channels.whatsapp.reactionLevel` في مدى استخدام الوكيل لتفاعلات emoji على WhatsApp:

| المستوى      | تفاعلات التأكيد | التفاعلات التي يبدأها الوكيل | الوصف |
| ------------ | ---------------- | ---------------------------- | ----- |
| `"off"`       | لا               | لا                           | لا توجد تفاعلات على الإطلاق |
| `"ack"`       | نعم              | لا                           | تفاعلات التأكيد فقط (إيصال ما قبل الرد) |
| `"minimal"`   | نعم              | نعم (بشكل متحفظ)            | تأكيد + تفاعلات الوكيل بإرشاد متحفظ |
| `"extensive"` | نعم              | نعم (مُشجَّعة)              | تأكيد + تفاعلات الوكيل بإرشاد مُشجَّع |

الافتراضي: `"minimal"`.

تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## تفاعلات التأكيد

يدعم WhatsApp تفاعلات تأكيد فورية عند استلام الرسائل الواردة عبر `channels.whatsapp.ackReaction`.
تكون تفاعلات التأكيد مقيّدة بواسطة `reactionLevel` — ويتم كبتها عندما تكون `reactionLevel` هي `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

ملاحظات السلوك:

- تُرسل مباشرة بعد قبول الإدخال الوارد (قبل الرد)
- تُسجّل حالات الفشل لكنها لا تمنع تسليم الرد العادي
- في وضع المجموعات `mentions`، يتم التفاعل في الأدوار التي تُشغَّل بالإشارة؛ ويعمل تفعيل المجموعة `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp ‏`channels.whatsapp.ackReaction` (ولا يُستخدم هنا الإعداد القديم `messages.ackReaction`)

## الحسابات المتعددة وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحساب والإعدادات الافتراضية">
    - تأتي معرّفات الحسابات من `channels.whatsapp.accounts`
    - الاختيار الافتراضي للحساب: `default` إذا كان موجودًا، وإلا أول معرّف حساب مكوَّن (بعد الفرز)
    - تتم تسوية معرّفات الحسابات داخليًا لأغراض البحث
  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق مع الإصدارات القديمة">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخة الاحتياطية: `creds.json.bak`
    - لا يزال مسار المصادقة القديم الافتراضي في `~/.openclaw/credentials/` معروفًا/تتم هجرته لتدفقات الحساب الافتراضي
  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يقوم `openclaw channels logout --channel whatsapp [--account <id>]` بمسح حالة مصادقة WhatsApp لذلك الحساب.

    في أدلة المصادقة القديمة، يتم الاحتفاظ بـ `oauth.json` بينما تتم إزالة ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وعمليات كتابة التكوين

- يتضمن دعم أدوات الوكيل إجراء التفاعل في WhatsApp ‏(`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- تكون عمليات كتابة التكوين التي تبدأها القناة مفعلة افتراضيًا (يمكن تعطيلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (مطلوب QR)">
    العرض: تشير حالة القناة إلى أنها غير مرتبطة.

    الإصلاح:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="مرتبط لكن غير متصل / حلقة إعادة اتصال">
    العرض: حساب مرتبط مع انقطاعات متكررة أو محاولات إعادة اتصال.

    الإصلاح:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    عند الحاجة، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل عمليات الإرسال الصادرة بسرعة عند عدم وجود مستمع Gateway نشط للحساب المستهدف.

    تأكد من أن Gateway يعمل وأن الحساب مرتبط.

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعات بشكل غير متوقع">
    تحقق بهذا الترتيب:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة السماح `groups`
    - تقييد الإشارة (`requireMention` + أنماط الإشارة)
    - المفاتيح المكررة في `openclaw.json` ‏(JSON5): تتجاوز الإدخالات اللاحقة الإدخالات السابقة، لذا احتفظ بقيمة `groupPolicy` واحدة فقط لكل نطاق

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    يجب أن يستخدم وقت تشغيل WhatsApp Gateway ‏Node. يتم تصنيف Bun على أنه غير متوافق مع التشغيل المستقر لـ Gateway في WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## system prompts

يدعم WhatsApp system prompts على نمط Telegram للمجموعات والمحادثات المباشرة عبر خريطتي `groups` و`direct`.

تسلسل الحل لرسائل المجموعات:

يتم تحديد خريطة `groups` الفعالة أولًا: إذا كان الحساب يعرّف `groups` خاصته، فإنها تستبدل بالكامل خريطة `groups` الجذرية (من دون دمج عميق). ثم يُجرى البحث عن prompt على الخريطة المفردة الناتجة:

1. **system prompt خاص بالمجموعة** (`groups["<groupId>"].systemPrompt`): يُستخدم إذا كانت إدخالة المجموعة المحددة تعرّف `systemPrompt`.
2. **system prompt عام للمجموعات** (`groups["*"].systemPrompt`): يُستخدم عندما تكون إدخالة المجموعة المحددة غائبة أو لا تعرّف `systemPrompt`.

تسلسل الحل للرسائل المباشرة:

يتم تحديد خريطة `direct` الفعالة أولًا: إذا كان الحساب يعرّف `direct` خاصته، فإنها تستبدل بالكامل خريطة `direct` الجذرية (من دون دمج عميق). ثم يُجرى البحث عن prompt على الخريطة المفردة الناتجة:

1. **system prompt خاص بمحادثة مباشرة محددة** (`direct["<peerId>"].systemPrompt`): يُستخدم إذا كانت إدخالة النظير المحددة تعرّف `systemPrompt`.
2. **system prompt عام للمحادثات المباشرة** (`direct["*"].systemPrompt`): يُستخدم عندما تكون إدخالة النظير المحددة غائبة أو لا تعرّف `systemPrompt`.

ملاحظة: يظل `dms` حاوية التجاوزات الخفيفة لسجل كل رسالة مباشرة (`dms.<id>.historyLimit`)؛ وتوجد تجاوزات prompt تحت `direct`.

**الاختلاف عن سلوك الحسابات المتعددة في Telegram:** في Telegram، يتم عمدًا تعطيل `groups` الجذرية لكل الحسابات في إعداد الحسابات المتعددة — حتى الحسابات التي لا تعرّف `groups` خاصة بها — لمنع bot من تلقي رسائل مجموعات لا ينتمي إليها. لا يطبق WhatsApp هذا القيد: إذ يتم دائمًا توريث `groups` الجذرية و`direct` الجذرية إلى الحسابات التي لا تعرّف تجاوزًا على مستوى الحساب، بغض النظر عن عدد الحسابات المكوّنة. في إعداد WhatsApp متعدد الحسابات، إذا كنت تريد prompts خاصة بكل حساب للمجموعات أو المحادثات المباشرة، فعرّف الخريطة الكاملة تحت كل حساب صراحةً بدلًا من الاعتماد على الإعدادات الافتراضية على مستوى الجذر.

سلوك مهم:

- `channels.whatsapp.groups` هي في الوقت نفسه خريطة تكوين لكل مجموعة وقائمة السماح على مستوى محادثة المجموعة. على مستوى الجذر أو الحساب، تعني `groups["*"]` أن "جميع المجموعات مسموح بها" في ذلك النطاق.
- لا تضف `systemPrompt` عامًا للمجموعات إلا عندما تريد بالفعل أن يسمح ذلك النطاق بكل المجموعات. إذا كنت لا تزال تريد أن تكون مجموعة ثابتة من معرّفات المجموعات فقط مؤهلة، فلا تستخدم `groups["*"]` كإعداد افتراضي لـ prompt. بدلًا من ذلك، كرر prompt في كل إدخالة مجموعة مضافة صراحةً إلى قائمة السماح.
- قبول المجموعة وتفويض المرسل فحصان منفصلان. توسّع `groups["*"]` مجموعة المجموعات التي يمكن أن تصل إلى معالجة المجموعات، لكنها لا تفوّض بحد ذاتها كل مرسل في تلك المجموعات. يظل الوصول للمرسلين متحكمًا فيه بشكل منفصل عبر `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا يملك `channels.whatsapp.direct` الأثر الجانبي نفسه للرسائل المباشرة. توفّر `direct["*"]` فقط تكوينًا افتراضيًا للمحادثات المباشرة بعد أن يتم قبول الرسالة المباشرة بالفعل بواسطة `dmPolicy` بالإضافة إلى `allowFrom` أو قواعد مخزن الاقتران.

مثال:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // استخدم هذا فقط إذا كان يجب السماح بكل المجموعات في نطاق الجذر.
        // ينطبق على كل الحسابات التي لا تعرّف خريطة groups خاصة بها.
        "*": { systemPrompt: "prompt افتراضي لكل المجموعات." },
      },
      direct: {
        // ينطبق على كل الحسابات التي لا تعرّف خريطة direct خاصة بها.
        "*": { systemPrompt: "prompt افتراضي لكل المحادثات المباشرة." },
      },
      accounts: {
        work: {
          groups: {
            // يعرّف هذا الحساب groups خاصة به، لذا يتم استبدال groups الجذرية
            // بالكامل. للحفاظ على wildcard، عرّف "*" صراحةً هنا أيضًا.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "التركيز على إدارة المشاريع.",
            },
            // استخدم هذا فقط إذا كان يجب السماح بكل المجموعات في هذا الحساب.
            "*": { systemPrompt: "prompt افتراضي لمجموعات العمل." },
          },
          direct: {
            // يعرّف هذا الحساب خريطة direct خاصة به، لذا يتم استبدال إدخالات direct الجذرية
            // بالكامل. للحفاظ على wildcard، عرّف "*" صراحةً هنا أيضًا.
            "+15551234567": { systemPrompt: "prompt لمحادثة مباشرة محددة خاصة بالعمل." },
            "*": { systemPrompt: "prompt افتراضي للمحادثات المباشرة الخاصة بالعمل." },
          },
        },
      },
    },
  },
}
```

## مؤشرات مرجع التكوين

المرجع الأساسي:

- [مرجع التكوين - WhatsApp](/ar/gateway/configuration-reference#whatsapp)

حقول WhatsApp عالية الأهمية:

- الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- التسليم: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- الحسابات المتعددة: `accounts.<id>.enabled`, `accounts.<id>.authDir`, والتجاوزات على مستوى الحساب
- العمليات: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- سلوك الجلسة: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
