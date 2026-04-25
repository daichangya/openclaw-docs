---
read_when:
    - العمل على سلوك قناة WhatsApp/web أو توجيه البريد الوارد
summary: دعم قناة WhatsApp وعناصر التحكم في الوصول وسلوك التسليم والعمليات
title: WhatsApp
x-i18n:
    generated_at: "2026-04-25T13:42:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf31e099230c65d9a97b976b11218b0c0bd4559e7917cdcf9b393633443528b4
    source_path: channels/whatsapp.md
    workflow: 15
---

الحالة: جاهز للإنتاج عبر WhatsApp Web ‏(Baileys). تتولى Gateway الجلسة أو الجلسات المرتبطة.

## التثبيت (عند الطلب)

- أثناء الإعداد (`openclaw onboard`) وعند تشغيل `openclaw channels add --channel whatsapp`
  سيُطلب منك تثبيت Plugin الخاص بـ WhatsApp في أول مرة تختاره فيها.
- يوفّر `openclaw channels login --channel whatsapp` أيضًا تدفق التثبيت عندما
  لا يكون الـ Plugin موجودًا بعد.
- قناة التطوير + نسخة git checkout: يكون الإعداد الافتراضي هو مسار Plugin المحلي.
- Stable/Beta: يكون الإعداد الافتراضي هو حزمة npm ‏`@openclaw/whatsapp`.

يبقى التثبيت اليدوي متاحًا:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل المباشرة الافتراضية هي الاقتران للمرسلين غير المعروفين.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة الإصلاح.
  </Card>
  <Card title="إعداد Gateway" icon="settings" href="/ar/gateway/configuration">
    الأنماط والأمثلة الكاملة لإعداد القنوات.
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

    لإرفاق دليل مصادقة WhatsApp Web موجود/مخصص قبل تسجيل الدخول:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="بدء تشغيل Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="الموافقة على أول طلب اقتران (إذا كنت تستخدم وضع الاقتران)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة. الحد الأقصى للطلبات المعلقة هو 3 لكل قناة.

  </Step>
</Steps>

<Note>
يوصي OpenClaw بتشغيل WhatsApp على رقم منفصل كلما أمكن ذلك. (تم تحسين بيانات تعريف القناة وتدفق الإعداد لهذا النمط، لكن إعدادات الرقم الشخصي مدعومة أيضًا.)
</Note>

## أنماط النشر

<AccordionGroup>
  <Accordion title="رقم مخصص (موصى به)">
    هذا هو وضع التشغيل الأنظف:

    - هوية WhatsApp منفصلة لـ OpenClaw
    - حدود أوضح لقوائم سماح الرسائل المباشرة والتوجيه
    - احتمال أقل لحدوث التباس مع الدردشة الذاتية

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

  <Accordion title="الرجوع إلى الرقم الشخصي">
    يدعم الإعداد الأولي وضع الرقم الشخصي ويكتب خط أساس مناسبًا للدردشة الذاتية:

    - `dmPolicy: "allowlist"`
    - تتضمن `allowFrom` رقمك الشخصي
    - `selfChatMode: true`

    في وقت التشغيل، تستند وسائل الحماية من الدردشة الذاتية إلى الرقم الذاتي المرتبط وإلى `allowFrom`.

  </Accordion>

  <Accordion title="نطاق القناة المحصور في WhatsApp Web">
    تعتمد قناة منصة المراسلة على WhatsApp Web ‏(`Baileys`) في بنية قنوات OpenClaw الحالية.

    لا توجد قناة مراسلة WhatsApp منفصلة عبر Twilio داخل سجل قنوات الدردشة المدمج.

  </Accordion>
</AccordionGroup>

## نموذج وقت التشغيل

- تتولى Gateway مقبس WhatsApp وحلقة إعادة الاتصال.
- تتطلب الإرسالات الصادرة مستمع WhatsApp نشطًا للحساب المستهدف.
- يتم تجاهل دردشات الحالة والبث (`@status` و`@broadcast`).
- تستخدم الدردشات المباشرة قواعد جلسة الرسائل المباشرة (`session.dmScope`؛ القيمة الافتراضية `main` تدمج الرسائل المباشرة في الجلسة الرئيسية للوكيل).
- تكون جلسات المجموعات معزولة (`agent:<agentId>:whatsapp:group:<jid>`).
- يلتزم نقل WhatsApp Web بمتغيرات بيئة الوكيل القياسية على مضيف Gateway ‏(`HTTPS_PROXY` و`HTTP_PROXY` و`NO_PROXY` أو النسخ ذات الأحرف الصغيرة). فضّل إعداد الوكيل على مستوى المضيف على إعدادات وكيل WhatsApp الخاصة بالقناة.

## خطافات Plugin والخصوصية

قد تحتوي رسائل WhatsApp الواردة على محتوى رسائل شخصية وأرقام هواتف
ومعرّفات مجموعات وأسماء مرسلين وحقول ربط الجلسات. لذلك،
لا يقوم WhatsApp ببث حمولات hook الواردة من `message_received` إلى Plugins
إلا إذا قمت بتفعيل ذلك صراحةً:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

يمكنك حصر التفعيل في حساب واحد:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

فعّل هذا فقط للـ Plugins التي تثق بها لتلقي محتوى
رسائل WhatsApp الواردة ومعرّفاتها.

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.whatsapp.dmPolicy` في الوصول إلى الدردشات المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    تقبل `allowFrom` أرقامًا بنمط E.164 ‏(تُطبّع داخليًا).

    تجاوز متعدد الحسابات: تأخذ `channels.whatsapp.accounts.<id>.dmPolicy` (و`allowFrom`) الأولوية على الإعدادات الافتراضية على مستوى القناة لذلك الحساب.

    تفاصيل سلوك وقت التشغيل:

    - تُحفَظ الاقترانات في مخزن السماح الخاص بالقناة وتُدمج مع `allowFrom` المكوّنة
    - إذا لم تُكوَّن أي قائمة سماح، يُسمح بالرقم الذاتي المرتبط افتراضيًا
    - لا يقوم OpenClaw مطلقًا باقتران تلقائي لرسائل `fromMe` المباشرة الصادرة (الرسائل التي ترسلها إلى نفسك من الجهاز المرتبط)

  </Tab>

  <Tab title="سياسة المجموعات + قوائم السماح">
    يحتوي وصول المجموعات على طبقتين:

    1. **قائمة سماح عضوية المجموعة** (`channels.whatsapp.groups`)
       - إذا تم حذف `groups`، تكون جميع المجموعات مؤهلة
       - إذا كانت `groups` موجودة، فإنها تعمل كقائمة سماح للمجموعات (مع السماح بـ `"*"`)

    2. **سياسة مرسل المجموعة** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: يتم تجاوز قائمة سماح المرسلين
       - `allowlist`: يجب أن يطابق المرسل `groupAllowFrom` (أو `*`)
       - `disabled`: حظر جميع الرسائل الواردة من المجموعات

    الاحتياط لقائمة سماح المرسلين:

    - إذا لم يتم تعيين `groupAllowFrom`، يعود وقت التشغيل إلى `allowFrom` عند توفرها
    - يتم تقييم قوائم سماح المرسلين قبل تفعيل الإشارة/الرد

    ملاحظة: إذا لم يكن هناك أي كتلة `channels.whatsapp` على الإطلاق، فسيكون احتياط سياسة المجموعات في وقت التشغيل هو `allowlist` (مع سجل تحذير)، حتى إذا تم تعيين `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="الإشارات + /activation">
    تتطلب الردود في المجموعات إشارة افتراضيًا.

    يتضمن اكتشاف الإشارة ما يلي:

    - إشارات WhatsApp صريحة لهوية البوت
    - أنماط mention regex المكوّنة (`agents.list[].groupChat.mentionPatterns`، والاحتياط هو `messages.groupChat.mentionPatterns`)
    - اكتشاف ضمني للرد على البوت (مرسل الرد يطابق هوية البوت)

    ملاحظة أمنية:

    - يلبّي الاقتباس/الرد فقط شرط تقييد الإشارة؛ لكنه **لا** يمنح تفويضًا للمرسل
    - مع `groupPolicy: "allowlist"`، يظل المرسلون غير الموجودين في قائمة السماح محظورين حتى إذا ردوا على رسالة من مستخدم موجود في قائمة السماح

    أمر التفعيل على مستوى الجلسة:

    - `/activation mention`
    - `/activation always`

    يحدّث `activation` حالة الجلسة (وليس الإعداد العام). وهو محكوم بالمالك.

  </Tab>
</Tabs>

## سلوك الرقم الشخصي والدردشة الذاتية

عندما يكون الرقم الذاتي المرتبط موجودًا أيضًا في `allowFrom`، تُفعَّل وسائل حماية الدردشة الذاتية في WhatsApp:

- تخطي إيصالات القراءة في أدوار الدردشة الذاتية
- تجاهل سلوك التحفيز التلقائي mention-JID الذي كان سيؤدي بخلاف ذلك إلى تنبيهك أنت
- إذا لم يتم تعيين `messages.responsePrefix`، فسيكون بادئة ردود الدردشة الذاتية افتراضيًا `[{identity.name}]` أو `[openclaw]`

## تطبيع الرسائل والسياق

<AccordionGroup>
  <Accordion title="المظروف الوارد + سياق الرد">
    تُغلَّف رسائل WhatsApp الواردة داخل المظروف الوارد المشترك.

    إذا وُجد رد مقتبس، يُضاف السياق بهذا الشكل:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    تُملأ أيضًا حقول بيانات تعريف الرد عند توفرها (`ReplyToId` و`ReplyToBody` و`ReplyToSender` ومرسل JID/E.164).

  </Accordion>

  <Accordion title="العناصر النائبة للوسائط واستخراج الموقع/جهة الاتصال">
    تُطبَّع الرسائل الواردة التي تحتوي على وسائط فقط باستخدام عناصر نائبة مثل:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    تستخدم نصوص الموقع نصًا موجزًا للإحداثيات. وتُعرَض تسميات/تعليقات الموقع وتفاصيل جهة الاتصال/vCard كبيانات تعريف غير موثوق بها داخل كتل fenced، وليس كنص موجّه مضمن.

  </Accordion>

  <Accordion title="حقن سجل المجموعات المعلّق">
    بالنسبة إلى المجموعات، يمكن تخزين الرسائل غير المعالجة مؤقتًا وحقنها كسياق عندما يتم تشغيل البوت أخيرًا.

    - الحد الافتراضي: `50`
    - الإعداد: `channels.whatsapp.historyLimit`
    - الاحتياط: `messages.groupChat.historyLimit`
    - القيمة `0` تعطّل الميزة

    علامات الحقن:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="إيصالات القراءة">
    تُفعّل إيصالات القراءة افتراضيًا لرسائل WhatsApp الواردة المقبولة.

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

    تتخطى أدوار الدردشة الذاتية إيصالات القراءة حتى عندما تكون مفعّلة على مستوى عام.

  </Accordion>
</AccordionGroup>

## التسليم والتجزئة والوسائط

<AccordionGroup>
  <Accordion title="تجزئة النص">
    - الحد الافتراضي للتجزئة: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - يفضّل وضع `newline` حدود الفقرات (الأسطر الفارغة)، ثم يعود إلى تجزئة آمنة بحسب الطول
  </Accordion>

  <Accordion title="سلوك الوسائط الصادرة">
    - يدعم الحمولات من الصور والفيديو والصوت (الملاحظات الصوتية PTT) والمستندات
    - تحافظ حمولات الرد على `audioAsVoice`؛ ويرسل WhatsApp الوسائط الصوتية كملاحظات صوتية Baileys PTT
    - يتم تحويل الصوت غير Ogg، بما في ذلك خرج Microsoft Edge TTS بصيغة MP3/WebM، إلى Ogg/Opus قبل تسليمه كـ PTT
    - يُرسل الصوت الأصلي Ogg/Opus مع `audio/ogg; codecs=opus` للتوافق مع الملاحظات الصوتية
    - يتم دعم تشغيل GIF المتحرك عبر `gifPlayback: true` في عمليات إرسال الفيديو
    - تُطبَّق التسميات التوضيحية على أول عنصر وسائط عند إرسال حمولات رد متعددة الوسائط
    - يمكن أن يكون مصدر الوسائط HTTP(S) أو `file://` أو مسارات محلية
  </Accordion>

  <Accordion title="حدود حجم الوسائط وسلوك الاحتياط">
    - الحد الأقصى لحفظ الوسائط الواردة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - الحد الأقصى لإرسال الوسائط الصادرة: `channels.whatsapp.mediaMaxMb` (الافتراضي `50`)
    - تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - يتم تحسين الصور تلقائيًا (تغيير الحجم/مراجعة الجودة) لتناسب الحدود
    - عند فشل إرسال الوسائط، يرسل احتياط العنصر الأول تحذيرًا نصيًا بدلاً من إسقاط الرد بصمت
  </Accordion>
</AccordionGroup>

## اقتباس الرد

يدعم WhatsApp اقتباس الرد الأصلي، حيث تقتبس الردود الصادرة الرسالة الواردة بشكل مرئي. تحكم في ذلك باستخدام `channels.whatsapp.replyToMode`.

| القيمة       | السلوك                                                              |
| ------------ | ------------------------------------------------------------------- |
| `"off"`      | لا تقتبس مطلقًا؛ أرسلها كرسالة عادية                               |
| `"first"`    | اقتبس أول جزء فقط من الرد الصادر                                    |
| `"all"`      | اقتبس كل جزء من أجزاء الرد الصادر                                   |
| `"batched"`  | اقتبس الردود المجمعة في قائمة الانتظار مع ترك الردود الفورية بلا اقتباس |

القيمة الافتراضية هي `"off"`. تستخدم التجاوزات لكل حساب `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## مستوى التفاعل

يتحكم `channels.whatsapp.reactionLevel` في مدى اتساع استخدام الوكيل لتفاعلات الرموز التعبيرية على WhatsApp:

| المستوى      | تفاعلات التأكيد | التفاعلات التي يبدأها الوكيل | الوصف                                            |
| ------------ | --------------- | ---------------------------- | ------------------------------------------------ |
| `"off"`      | لا              | لا                           | لا توجد تفاعلات إطلاقًا                          |
| `"ack"`      | نعم             | لا                           | تفاعلات التأكيد فقط (إقرار قبل الرد)             |
| `"minimal"`  | نعم             | نعم (بحذر)                   | تأكيد + تفاعلات الوكيل مع توجيه متحفظ            |
| `"extensive"`| نعم             | نعم (مشجعة)                  | تأكيد + تفاعلات الوكيل مع توجيه مشجع             |

القيمة الافتراضية: `"minimal"`.

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

يدعم WhatsApp تفاعلات التأكيد الفورية عند استلام الرسائل الواردة عبر `channels.whatsapp.ackReaction`.
تخضع تفاعلات التأكيد إلى `reactionLevel` — ويتم كتمها عندما تكون قيمة `reactionLevel` هي `"off"`.

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

- تُرسل فورًا بعد قبول الرسالة الواردة (قبل الرد)
- يتم تسجيل حالات الفشل لكنها لا تمنع تسليم الرد العادي
- في وضع `mentions` للمجموعات، يتم التفاعل في الأدوار التي تُفعَّل عبر الإشارة؛ ويعمل تفعيل المجموعة `always` كتجاوز لهذا الفحص
- يستخدم WhatsApp القيمة `channels.whatsapp.ackReaction` (ولا يتم استخدام `messages.ackReaction` القديم هنا)

## الحسابات المتعددة وبيانات الاعتماد

<AccordionGroup>
  <Accordion title="اختيار الحساب والإعدادات الافتراضية">
    - تأتي معرّفات الحسابات من `channels.whatsapp.accounts`
    - اختيار الحساب الافتراضي: `default` إذا كان موجودًا، وإلا فمعرّف الحساب الأول الذي تم تكوينه (بعد الفرز)
    - يتم تطبيع معرّفات الحسابات داخليًا لأغراض البحث
  </Accordion>

  <Accordion title="مسارات بيانات الاعتماد والتوافق القديم">
    - مسار المصادقة الحالي: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - ملف النسخ الاحتياطي: `creds.json.bak`
    - لا يزال يتم التعرف على المصادقة الافتراضية القديمة في `~/.openclaw/credentials/` أو ترحيلها في تدفقات الحساب الافتراضي
  </Accordion>

  <Accordion title="سلوك تسجيل الخروج">
    يؤدي `openclaw channels logout --channel whatsapp [--account <id>]` إلى مسح حالة مصادقة WhatsApp لذلك الحساب.

    في أدلة المصادقة القديمة، يتم الاحتفاظ بـ `oauth.json` بينما تُزال ملفات مصادقة Baileys.

  </Accordion>
</AccordionGroup>

## الأدوات والإجراءات وكتابات الإعداد

- يتضمن دعم أدوات الوكيل إجراء تفاعل WhatsApp ‏(`react`).
- بوابات الإجراءات:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- تكون كتابات الإعداد التي تبدأها القناة مفعّلة افتراضيًا (يمكن تعطيلها عبر `channels.whatsapp.configWrites=false`).

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="غير مرتبط (يتطلب QR)">
    العرض: تُبلغ حالة القناة بأنها غير مرتبطة.

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

    إذا لزم الأمر، أعد الربط باستخدام `channels login`.

  </Accordion>

  <Accordion title="لا يوجد مستمع نشط عند الإرسال">
    تفشل الإرسالات الصادرة بسرعة عندما لا يوجد مستمع Gateway نشط للحساب المستهدف.

    تأكد من أن Gateway قيد التشغيل وأن الحساب مرتبط.

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعات بشكل غير متوقع">
    تحقّق بالترتيب التالي:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - إدخالات قائمة السماح في `groups`
    - تقييد الإشارات (`requireMention` + أنماط الإشارة)
    - المفاتيح المكررة في `openclaw.json` ‏(JSON5): الإدخالات اللاحقة تتجاوز السابقة، لذا احتفظ بقيمة `groupPolicy` واحدة فقط لكل نطاق

  </Accordion>

  <Accordion title="تحذير وقت تشغيل Bun">
    يجب أن يستخدم وقت تشغيل Gateway الخاص بـ WhatsApp بيئة Node. ويتم تمييز Bun على أنه غير متوافق مع التشغيل المستقر لـ Gateway الخاص بـ WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## موجّهات النظام

يدعم WhatsApp موجّهات النظام على نمط Telegram للمجموعات والدردشات المباشرة عبر خرائط `groups` و`direct`.

البنية الهرمية للحسم لرسائل المجموعات:

يتم أولاً تحديد خريطة `groups` الفعالة: إذا كان الحساب يعرّف `groups` خاصته، فإنها تستبدل تمامًا خريطة `groups` الجذرية (من دون دمج عميق). ثم يتم البحث عن الموجّه على الخريطة المفردة الناتجة:

1. **موجّه نظام خاص بالمجموعة** (`groups["<groupId>"].systemPrompt`): يُستخدم عندما يكون إدخال المجموعة المحدد موجودًا في الخريطة **ويكون** مفتاح `systemPrompt` معرّفًا فيها. إذا كانت قيمة `systemPrompt` سلسلة فارغة (`""`)، يتم تعطيل حرف البدل ولا يُطبَّق أي موجّه نظام.
2. **موجّه نظام حرف بدل للمجموعة** (`groups["*"].systemPrompt`): يُستخدم عندما يكون إدخال المجموعة المحدد غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

البنية الهرمية للحسم للرسائل المباشرة:

يتم أولاً تحديد خريطة `direct` الفعالة: إذا كان الحساب يعرّف `direct` خاصته، فإنها تستبدل تمامًا خريطة `direct` الجذرية (من دون دمج عميق). ثم يتم البحث عن الموجّه على الخريطة المفردة الناتجة:

1. **موجّه نظام خاص بالمباشر** (`direct["<peerId>"].systemPrompt`): يُستخدم عندما يكون إدخال النظير المحدد موجودًا في الخريطة **ويكون** مفتاح `systemPrompt` معرّفًا فيها. إذا كانت قيمة `systemPrompt` سلسلة فارغة (`""`)، يتم تعطيل حرف البدل ولا يُطبَّق أي موجّه نظام.
2. **موجّه نظام حرف بدل للمباشر** (`direct["*"].systemPrompt`): يُستخدم عندما يكون إدخال النظير المحدد غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

ملاحظة: يظل `dms` هو الحاوية الخفيفة لتجاوز السجل لكل رسالة مباشرة (`dms.<id>.historyLimit`)؛ بينما توجد تجاوزات الموجّهات ضمن `direct`.

**الاختلاف عن سلوك Telegram متعدد الحسابات:** في Telegram، يتم تعطيل `groups` الجذرية عمدًا لجميع الحسابات في إعداد متعدد الحسابات — حتى الحسابات التي لا تعرّف `groups` خاصة بها — لمنع البوت من تلقي رسائل مجموعات لا ينتمي إليها. لا يطبق WhatsApp هذا القيد: إذ يتم دائمًا توريث `groups` الجذرية و`direct` الجذرية إلى الحسابات التي لا تعرّف تجاوزًا على مستوى الحساب، بغض النظر عن عدد الحسابات المكوّنة. في إعداد WhatsApp متعدد الحسابات، إذا أردت موجّهات مجموعات أو موجّهات مباشرة لكل حساب، فعرّف الخريطة الكاملة صراحةً تحت كل حساب بدلًا من الاعتماد على الإعدادات الافتراضية على مستوى الجذر.

سلوك مهم:

- إن `channels.whatsapp.groups` هو في الوقت نفسه خريطة إعداد لكل مجموعة وقائمة السماح بالمجموعات على مستوى الدردشة. وعلى مستوى الجذر أو الحساب، تعني `groups["*"]` أن "جميع المجموعات مسموح بها" لذلك النطاق.
- أضف موجّه نظام للمجموعة باستخدام حرف بدل فقط عندما تكون تريد بالفعل أن يسمح ذلك النطاق بجميع المجموعات. وإذا كنت لا تزال تريد أن تكون مجموعة ثابتة فقط من معرّفات المجموعات مؤهلة، فلا تستخدم `groups["*"]` كإعداد افتراضي للموجّه. بدلًا من ذلك، كرّر الموجّه في كل إدخال مجموعة مضاف صراحةً إلى قائمة السماح.
- قبول المجموعة وتفويض المرسل عمليتا تحقق منفصلتان. توسّع `groups["*"]` مجموعة المجموعات التي يمكن أن تصل إلى معالجة المجموعات، لكنها لا تفوض بحد ذاتها جميع المرسلين في تلك المجموعات. يظل الوصول الخاص بالمرسل خاضعًا بشكل منفصل إلى `channels.whatsapp.groupPolicy` و`channels.whatsapp.groupAllowFrom`.
- لا يملك `channels.whatsapp.direct` الأثر الجانبي نفسه بالنسبة إلى الرسائل المباشرة. إذ توفّر `direct["*"]` فقط إعدادًا افتراضيًا للدردشة المباشرة بعد أن تكون الرسالة المباشرة قد قُبلت بالفعل بواسطة `dmPolicy` مع `allowFrom` أو قواعد مخزن الاقتران.

مثال:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // استخدم هذا فقط إذا كان يجب السماح بجميع المجموعات في نطاق الجذر.
        // ينطبق على كل الحسابات التي لا تعرّف خريطة groups خاصة بها.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // ينطبق على كل الحسابات التي لا تعرّف خريطة direct خاصة بها.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // هذا الحساب يعرّف groups خاصة به، لذا يتم استبدال groups الجذرية
            // بالكامل. للاحتفاظ بحرف بدل، عرّف "*" صراحةً هنا أيضًا.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // استخدم هذا فقط إذا كان يجب السماح بجميع المجموعات في هذا الحساب.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // هذا الحساب يعرّف خريطة direct خاصة به، لذا يتم استبدال إدخالات
            // direct الجذرية بالكامل. للاحتفاظ بحرف بدل، عرّف "*" صراحةً هنا أيضًا.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## مؤشرات مرجع الإعداد

المرجع الأساسي:

- [مرجع الإعداد - WhatsApp](/ar/gateway/config-channels#whatsapp)

حقول WhatsApp عالية الأهمية:

- الوصول: `dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom` و`groups`
- التسليم: `textChunkLimit` و`chunkMode` و`mediaMaxMb` و`sendReadReceipts` و`ackReaction` و`reactionLevel`
- الحسابات المتعددة: `accounts.<id>.enabled` و`accounts.<id>.authDir` والتجاوزات على مستوى الحساب
- العمليات: `configWrites` و`debounceMs` و`web.enabled` و`web.heartbeatSeconds` و`web.reconnect.*`
- سلوك الجلسة: `session.dmScope` و`historyLimit` و`dmHistoryLimit` و`dms.<id>.historyLimit`
- الموجّهات: `groups.<id>.systemPrompt` و`groups["*"].systemPrompt` و`direct.<id>.systemPrompt` و`direct["*"].systemPrompt`

## ذو صلة

- [الاقتران](/ar/channels/pairing)
- [المجموعات](/ar/channels/groups)
- [الأمان](/ar/gateway/security)
- [توجيه القنوات](/ar/channels/channel-routing)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [استكشاف الأخطاء وإصلاحها](/ar/channels/troubleshooting)
