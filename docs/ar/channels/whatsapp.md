---
read_when:
    - العمل على سلوك قناة WhatsApp/الويب أو توجيه صندوق الوارد
summary: دعم قناة WhatsApp، وعناصر التحكم في الوصول، وسلوك التسليم، والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T07:20:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: e14735a33ffb48334b920a5e63645abf3445f56481b1ce8b7c128800e2adc981
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (قناة الويب)

الحالة: جاهزة للإنتاج عبر WhatsApp Web ‏(Baileys). يملك Gateway الجلسة (أو الجلسات) المرتبطة.

## التثبيت (عند الطلب)

- يطلب كلٌّ من الإعداد الأوّلي (`openclaw onboard`) و`openclaw channels add --channel whatsapp`
  تثبيت Plugin الخاص بـ WhatsApp عند اختياره لأول مرة.
- يوفّر `openclaw channels login --channel whatsapp` أيضًا تدفّق التثبيت عندما
  لا يكون Plugin موجودًا بعد.
- قناة التطوير + نسخة git المحلية: تستخدم افتراضيًا مسار Plugin المحلي.
- Stable/Beta: تستخدم افتراضيًا حزمة npm ‏`@openclaw/whatsapp`.

يبقى التثبيت اليدوي متاحًا:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية هي الاقتران للمرسلين غير المعروفين.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة الإصلاح.
  </Card>
  <Card title="إعداد Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة إعداد القنوات الكاملة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="إعداد سياسة وصول WhatsApp">

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

    لحساب معيّن:

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

    تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة. والحد الأقصى للطلبات المعلّقة هو 3 لكل قناة.

  </Step>
</Steps>

<Note>
يوصي OpenClaw بتشغيل WhatsApp على رقم منفصل متى أمكن. (تُحسَّن بيانات القناة الوصفية وتدفّق الإعداد لهذا النمط، لكن إعدادات الأرقام الشخصية مدعومة أيضًا.)
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="رقم مخصص (موصى به)">
    هذا هو النمط التشغيلي الأنظف:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - حدود أوضح لقوائم السماح الخاصة بالرسائل المباشرة والتوجيه
    - احتمال أقل لحدوث التباس في الدردشة الذاتية

    نمط السياسة الأدنى:

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
    يدعم الإعداد الأوّلي وضع الرقم الشخصي ويكتب خط أساس ملائمًا للدردشة الذاتية:

    - `dmPolicy: "allowlist"`
    - تتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    أثناء التشغيل، تعتمد وسائل الحماية الخاصة بالدردشة الذاتية على الرقم الذاتي المرتبط و`allowFrom`.

  </Accordion>

  <Accordion title="نطاق قناة WhatsApp Web فقط">
    قناة منصة المراسلة تعتمد على WhatsApp Web ‏(`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة WhatsApp منفصلة خاصة بـ Twilio في سجل قنوات الدردشة المضمَّن.

  </Accordion>
</AccordionGroup>

## نموذج وقت التشغيل

- يملك Gateway مقبس WhatsApp وحلقة إعادة الاتصال.
- تتطلب عمليات الإرسال الصادرة وجود مستمع WhatsApp نشط للحساب الهدف.
- يتم تجاهل دردشات الحالة والبث (`@status` و`@broadcast`).
- تستخدم الدردشات المباشرة قواعد جلسات الرسائل المباشرة (`session.dmScope`؛ والقيمة الافتراضية `main` تدمج الرسائل المباشرة في الجلسة الرئيسية للوكيل).
- تُعزل جلسات المجموعات (`agent:<agentId>:whatsapp:group:<jid>`).
- يراعي نقل WhatsApp Web متغيرات بيئة الوكيل القياسية على مضيف Gateway (`HTTPS_PROXY` و`HTTP_PROXY` و`NO_PROXY` / ونظائرها بالأحرف الصغيرة). فضّل إعداد الوكيل على مستوى المضيف بدلًا من إعدادات وكيل WhatsApp الخاصة بالقناة.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى الدردشة المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    تقبل `allowFrom` أرقامًا بنمط E.164 (مع تطبيع داخليًا).

    تجاوز الحسابات المتعددة: تأخذ `channels.whatsapp.accounts.<id>.dmPolicy` (وكذلك `allowFrom`) الأولوية على القيم الافتراضية على مستوى القناة لذلك الحساب.

    تفاصيل سلوك وقت التشغيل:

    - تُحفَظ الاقترانات في مخزن السماح الخاص بالقناة وتُدمج مع `allowFrom` المضبوطة
    - إذا لم تُضبط أي قائمة سماح، فيُسمح افتراضيًا بالرقم الذاتي المرتبط
    - لا يتم أبدًا اقتران الرسائل المباشرة الصادرة `fromMe` تلقائيًا

  </Tab>

  <Tab title="سياسة المجموعات + قوائم السماح">
    يملك الوصول إلى المجموعات طبقتين:

    1. **قائمة سماح عضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا تم حذف `groups`، تكون كل المجموعات مؤهلة
       - إذا كانت `groups` موجودة، فإنها تعمل كقائمة سماح للمجموعات (مع السماح بـ `"*"`)

    2. **سياسة مرسل المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: يتم تجاوز قائمة سماح المرسلين
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: حظر جميع الرسائل الواردة من المجموعات

    احتياط قائمة سماح المرسلين:

    - إذا لم يتم ضبط `groupAllowFrom`، فيعود وقت التشغيل إلى `allowFrom` عند توفرها
    - تُقيَّم قوائم سماح المرسلين قبل تفعيل الإشارة/الرد

    ملاحظة: إذا لم توجد أي كتلة `channels.whatsapp` على الإطلاق، فإن احتياط سياسة المجموعات أثناء التشغيل يكون `allowlist` (مع سجل تحذيري)، حتى لو كانت `channels.defaults.groupPolicy` مضبوطة.

  </Tab>

  <Tab title="الإشارات + /activation">
    تتطلب ردود المجموعات الإشارة افتراضيًا.

    يتضمن اكتشاف الإشارة ما يلي:

    - إشارات WhatsApp صريحة لهوية الروبوت
    - أنماط regex للإشارات المضبوطة (`agents.list[].groupChat.mentionPatterns`، مع الاحتياط إلى `messages.groupChat.mentionPatterns`)
    - اكتشاف ضمني للرد على الروبوت (تطابق مرسل الرد مع هوية الروبوت)

    ملاحظة أمان:

    - الاقتباس/الرد يلبّي فقط شرط بوابة الإشارة؛ لكنه **لا** يمنح تفويضًا للمرسل
    - مع `groupPolicy: "allowlist"`، يظل المرسلون غير الموجودين في قائمة السماح محظورين حتى إذا ردّوا على رسالة من مستخدم موجود في قائمة السماح

    أمر التفعيل على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يقوم `activation` بتحديث حالة الجلسة (وليس الإعداد العام). وهو مقيّد بالمالك.

  </Tab>
</Tabs>

## سلوك الرقم الشخصي والدردشة الذاتية

عندما يكون الرقم الذاتي المرتبط موجودًا أيضًا في `allowFrom`، تُفعَّل وسائل الحماية الخاصة بالدردشة الذاتية في WhatsApp:

- تخطي إيصالات القراءة لدورات الدردشة الذاتية
- تجاهل سلوك التحفيز التلقائي لـ mention-JID الذي قد يرسل تنبيهًا إلى نفسك خلاف ذلك
- إذا لم تُضبط `messages.responsePrefix`، فستكون ردود الدردشة الذاتية افتراضيًا `[{identity.name}]` أو `[openclaw]`

## تطبيع الرسائل والسياق

<AccordionGroup>
  <Accordion title="الغلاف الوارد + سياق الرد">
    تُغلّف رسائل WhatsApp الواردة في الغلاف الوارد المشترك.

    إذا وُجد رد مقتبَس، فيُلحَق السياق بهذا الشكل:

    ```text
    [ردًا على <sender> id:<stanzaId>]
    <نص مقتبَس أو عنصر نائب للوسائط>
    [/Replying]
    ```

    كما تُملأ حقول بيانات الرد الوصفية عند توفرها (`ReplyToId` و`ReplyToBody` و`ReplyToSender` وJID/E.164 الخاص بالمرسل).

  </Accordion>

  <Accordion title="عناصر الوسائط النائبة واستخراج الموقع/جهة الاتصال">
    تُطبَّع الرسائل الواردة التي تحتوي على وسائط فقط باستخدام عناصر نائبة مثل:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    تُطبَّع حمولات الموقع وجهة الاتصال إلى سياق نصي قبل التوجيه.

  </Accordion>

  <Accordion title="حقن السجل المعلّق للمجموعة">
    بالنسبة إلى المجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتًا وحقنها كسياق عندما يتم تشغيل الروبوت أخيرًا.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`
    - الاحتياط: `messages.groupChat.historyLimit`
    - `0` يعطّل ذلك

    علامات الحقن:

    - `[رسائل الدردشة منذ آخر رد منك - للسياق]`
    - `[الرسالة الحالية - رد على هذه]`

  </Accordion>

  <Accordion title="إيصالات القراءة">
    تكون إيصالات القراءة مفعّلة افتراضيًا لرسائل WhatsApp الواردة المقبولة.

    للتعطيل على المستوى العام:

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

    تتخطى دورات الدردشة الذاتية إيصالات القراءة حتى عند تفعيلها على المستوى العام.

  </Accordion>
</AccordionGroup>

## التسليم والتقسيم والوسائط

<AccordionGroup>
  <Accordion title="تقسيم النص">
    - حد التقسيم الافتراضي: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى تقسيم آمن حسب الطول
  </Accordion>

  <Accordion title="سلوك الوسائط الصادرة">
    - يدعم حمولات الصور والفيديو والصوت (مذكرة صوتية PTT) والمستندات
    - يُعاد كتابة `audio/ogg` إلى `audio/ogg; codecs=opus` من أجل توافق الملاحظات الصوتية
    - يُدعَم تشغيل GIF المتحرك عبر `gifPlayback: true` في عمليات إرسال الفيديو
    - تُطبَّق التسميات التوضيحية على أول عنصر وسائط عند إرسال حمولات رد متعددة الوسائط
    - يمكن أن يكون مصدر الوسائط HTTP(S) أو `file://` أو مسارات محلية
  </Accordion>

  <Accordion title="حدود حجم الوسائط وسلوك الاحتياط">
    - الحد الأقصى لحفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - الحد الأقصى لإرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم تجاوزات كل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - تُحسَّن الصور تلقائيًا (إعادة تحجيم/مسح الجودة) لتلائم الحدود
    - عند فشل إرسال الوسائط، يرسل احتياط العنصر الأول تحذيرًا نصيًا بدلًا من إسقاط الاستجابة بصمت
  </Accordion>
</AccordionGroup>

## اقتباس الرد

يدعم WhatsApp اقتباس الرد الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بشكل مرئي. تحكم في ذلك عبر `channels.whatsapp.replyToMode`.

| القيمة   | السلوك                                                                           |
| -------- | -------------------------------------------------------------------------------- |
| `"auto"` | اقتبس الرسالة الواردة عندما يدعم المزوّد ذلك؛ وتخطَّ الاقتباس خلاف ذلك            |
| `"on"`   | اقتبس الرسالة الواردة دائمًا؛ وارجع إلى إرسال عادي إذا تم رفض الاقتباس            |
| `"off"`  | لا تقتبس أبدًا؛ أرسل كرسالة عادية                                                |

القيمة الافتراضية هي `"auto"`. تستخدم تجاوزات كل حساب `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## مستوى التفاعلات

يتحكم `channels.whatsapp.reactionLevel` في مدى استخدام الوكيل لتفاعلات الرموز التعبيرية على WhatsApp:

| المستوى      | تفاعلات التأكيد | تفاعلات يبدأها الوكيل | الوصف                                            |
| ------------ | ---------------- | ---------------------- | ------------------------------------------------ |
| `"off"`      | لا               | لا                     | لا تفاعلات على الإطلاق                           |
| `"ack"`      | نعم              | لا                     | تفاعلات التأكيد فقط (إقرار قبل الرد)            |
| `"minimal"`  | نعم              | نعم (بحذر)             | تأكيد + تفاعلات وكيل بإرشادات متحفظة            |
| `"extensive"`| نعم              | نعم (مُشجَّعة)         | تأكيد + تفاعلات وكيل بإرشادات مشجَّعة           |

الافتراضي: `"minimal"`.

تستخدم تجاوزات كل حساب `channels.whatsapp.accounts.<id>.reactionLevel`.

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

يدعم WhatsApp تفاعلات التأكيد الفورية عند استلام الرسائل الواردة عبر `channels.whatsapp.ackReaction`.
تُضبط تفاعلات التأكيد بواسطة `reactionLevel` — ويتم كتمها عندما تكون `reactionLevel` هي `"off"`.

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

- يُرسَل فورًا بعد قبول الرسالة الواردة (قبل الرد)
- تُسجَّل الإخفاقات، لكنها لا تمنع تسليم الرد العادي
- في وضع المجموعات `mentions`، يتم التفاعل في الدورات التي تُفعَّل بالإشارة؛ ويعمل تفعيل المجموعات `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp القيمة `channels.whatsapp.ackReaction` (ولا تُستخدم هنا القيمة القديمة `messages.ackReaction`)

## الحسابات المتعددة وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحساب والقيم الافتراضية">
    - تأتي معرّفات الحسابات من `channels.whatsapp.accounts`
    - اختيار الحساب الافتراضي: `default` إذا كان موجودًا، وإلا أول معرّف حساب مضبوط (بعد الفرز)
    - تُطبَّع معرّفات الحسابات داخليًا لأغراض البحث
  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق مع الإصدارات القديمة">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخة الاحتياطية: `creds.json.bak`
    - لا يزال التعرّف على المصادقة الافتراضية القديمة في `~/.openclaw/credentials/` قائمًا/ويتم ترحيلها في تدفقات الحساب الافتراضي
  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يقوم `openclaw channels logout --channel whatsapp [--account <id>]` بمسح حالة مصادقة WhatsApp لذلك الحساب.

    في أدلة المصادقة القديمة، يتم الاحتفاظ بالملف `oauth.json` بينما تُزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وكتابات الإعداد

- يتضمن دعم أدوات الوكيل إجراء التفاعل في WhatsApp ‏(`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- تكون كتابات الإعداد التي تبدأها القناة مفعلة افتراضيًا (عطّلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (مطلوب QR)">
    العارض: تُظهر حالة القناة أنها غير مرتبطة.

    الإصلاح:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="مرتبط لكن غير متصل / حلقة إعادة اتصال">
    العارض: حساب مرتبط مع تكرار عمليات قطع الاتصال أو محاولات إعادة الاتصال.

    الإصلاح:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    عند الحاجة، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل عمليات الإرسال الصادرة بسرعة عندما لا يوجد مستمع Gateway نشط للحساب الهدف.

    تأكد من أن Gateway يعمل وأن الحساب مرتبط.

  </Accordion>

  <Accordion title="تجاهل رسائل المجموعات بشكل غير متوقع">
    تحقّق بهذا الترتيب:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة السماح `groups`
    - بوابة الإشارة (`requireMention` + أنماط الإشارة)
    - المفاتيح المكررة في `openclaw.json` ‏(JSON5): تتجاوز الإدخالات اللاحقة الإدخالات السابقة، لذا احتفظ بقيمة `groupPolicy` واحدة لكل نطاق

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    يجب أن يستخدم وقت تشغيل Gateway في WhatsApp بيئة Node. ويتم تمييز Bun على أنه غير متوافق مع التشغيل المستقر لـ Gateway الخاصة بـ WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## تعليمات النظام

يدعم WhatsApp تعليمات النظام على نمط Telegram للمجموعات والدردشات المباشرة عبر الخريطتين `groups` و`direct`.

البنية الهرمية لتحديد القيم لرسائل المجموعات:

يُحدَّد أولًا تعيين `groups` الفعّال: إذا عرّف الحساب `groups` خاصته، فإنه يستبدل بالكامل تعيين `groups` على مستوى الجذر (من دون دمج عميق). ثم يُنفَّذ البحث عن التعليمات في التعيين المفرد الناتج:

1. **تعليمات نظام خاصة بالمجموعة** (`groups["<groupId>"].systemPrompt`): تُستخدم إذا كان إدخال المجموعة المحددة يعرّف `systemPrompt`.
2. **تعليمات نظام عامة للمجموعات** (`groups["*"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة غائبًا أو لا يعرّف `systemPrompt`.

البنية الهرمية لتحديد القيم للرسائل المباشرة:

يُحدَّد أولًا تعيين `direct` الفعّال: إذا عرّف الحساب `direct` خاصته، فإنه يستبدل بالكامل تعيين `direct` على مستوى الجذر (من دون دمج عميق). ثم يُنفَّذ البحث عن التعليمات في التعيين المفرد الناتج:

1. **تعليمات نظام خاصة بالدردشة المباشرة** (`direct["<peerId>"].systemPrompt`): تُستخدم إذا كان إدخال النظير المحدد يعرّف `systemPrompt`.
2. **تعليمات نظام عامة للدردشة المباشرة** (`direct["*"].systemPrompt`): تُستخدم عندما يكون إدخال النظير المحدد غائبًا أو لا يعرّف `systemPrompt`.

ملاحظة: تظل `dms` حاويةً خفيفة لتجاوز سجل كل رسالة مباشرة على حدة (`dms.<id>.historyLimit`)؛ أما تجاوزات التعليمات فتوجد تحت `direct`.

**الاختلاف عن سلوك Telegram في الحسابات المتعددة:** في Telegram، يتم عمدًا كبح `groups` على مستوى الجذر لجميع الحسابات في إعداد الحسابات المتعددة — حتى الحسابات التي لا تعرّف `groups` خاصة بها — لمنع الروبوت من تلقي رسائل المجموعات التي لا ينتمي إليها. لا يطبق WhatsApp هذا القيد: إذ تُورَّث `groups` و`direct` على مستوى الجذر دائمًا إلى الحسابات التي لا تعرّف تجاوزًا على مستوى الحساب، بغض النظر عن عدد الحسابات المضبوطة. في إعداد WhatsApp متعدد الحسابات، إذا كنت تريد تعليمات مباشرة أو تعليمات مجموعات لكل حساب، فعرّف التعيين الكامل تحت كل حساب صراحةً بدلًا من الاعتماد على القيم الافتراضية على مستوى الجذر.

سلوك مهم:

- تمثل `channels.whatsapp.groups` في الوقت نفسه تعيين إعداد لكل مجموعة وقائمة السماح على مستوى دردشات المجموعات. وعلى مستوى الجذر أو الحساب، فإن `groups["*"]` تعني "السماح بجميع المجموعات" لذلك النطاق.
- أضف `systemPrompt` عامة للمجموعات فقط عندما تكون تريد أصلًا أن يسمح ذلك النطاق بجميع المجموعات. وإذا كنت لا تزال تريد أن تكون مجموعة ثابتة فقط من معرّفات المجموعات مؤهلة، فلا تستخدم `groups["*"]` كافتراضي للتعليمات. وبدلًا من ذلك، كرر التعليمات في كل إدخال مجموعة مُسمَح بها صراحةً.
- قبول المجموعة وتفويض المرسل فحصان منفصلان. يوسّع `groups["*"]` مجموعة المجموعات التي يمكن أن تصل إلى معالجة المجموعات، لكنه لا يفوّض تلقائيًا جميع المرسلين في تلك المجموعات. ولا يزال الوصول من جهة المرسل خاضعًا بشكل منفصل إلى `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا تملك `channels.whatsapp.direct` الأثر الجانبي نفسه بالنسبة إلى الرسائل المباشرة. إذ إن `direct["*"]` لا يوفّر إلا إعدادًا افتراضيًا للدردشة المباشرة بعد أن تُقبل الرسالة المباشرة أصلًا بواسطة `dmPolicy` مع `allowFrom` أو قواعد مخزن الاقتران.

مثال:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // استخدم هذا فقط إذا كان ينبغي السماح بجميع المجموعات على نطاق الجذر.
        // يُطبَّق على جميع الحسابات التي لا تعرّف تعيين groups خاصًا بها.
        "*": { systemPrompt: "التعليمات الافتراضية لجميع المجموعات." },
      },
      direct: {
        // يُطبَّق على جميع الحسابات التي لا تعرّف تعيين direct خاصًا بها.
        "*": { systemPrompt: "التعليمات الافتراضية لجميع الدردشات المباشرة." },
      },
      accounts: {
        work: {
          groups: {
            // يعرّف هذا الحساب groups خاصة به، لذا يتم استبدال groups على مستوى
            // الجذر بالكامل. وللاحتفاظ بقيمة عامة، عرّف "*" صراحةً هنا أيضًا.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "ركّز على إدارة المشاريع.",
            },
            // استخدم هذا فقط إذا كان ينبغي السماح بجميع المجموعات في هذا الحساب.
            "*": { systemPrompt: "التعليمات الافتراضية لمجموعات العمل." },
          },
          direct: {
            // يعرّف هذا الحساب direct خاصة به، لذا يتم استبدال إدخالات direct على
            // مستوى الجذر بالكامل. وللاحتفاظ بقيمة عامة، عرّف "*" صراحةً هنا أيضًا.
            "+15551234567": { systemPrompt: "تعليمات لدردشة مباشرة محددة للعمل." },
            "*": { systemPrompt: "التعليمات الافتراضية لدردشات العمل المباشرة." },
          },
        },
      },
    },
  },
}
```

## مؤشرات مرجع الإعداد

المرجع الأساسي:

- [مرجع الإعداد - WhatsApp](/ar/gateway/configuration-reference#whatsapp)

حقول WhatsApp عالية الأهمية:

- الوصول: `dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom` و`groups`
- التسليم: `textChunkLimit` و`chunkMode` و`mediaMaxMb` و`sendReadReceipts` و`ackReaction` و`reactionLevel`
- الحسابات المتعددة: `accounts.<id>.enabled` و`accounts.<id>.authDir` والتجاوزات على مستوى الحساب
- العمليات: `configWrites` و`debounceMs` و`web.enabled` و`web.heartbeatSeconds` و`web.reconnect.*`
- سلوك الجلسة: `session.dmScope` و`historyLimit` و`dmHistoryLimit` و`dms.<id>.historyLimit`
- التعليمات: `groups.<id>.systemPrompt` و`groups["*"].systemPrompt` و`direct.<id>.systemPrompt` و`direct["*"].systemPrompt`

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
