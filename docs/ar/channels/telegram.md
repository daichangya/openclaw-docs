---
read_when:
    - العمل على ميزات Telegram أو Webhook
summary: حالة دعم روبوت Telegram وإمكاناته وتهيئته
title: Telegram
x-i18n:
    generated_at: "2026-04-25T13:42:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24c32a83e86358afb662c9c354a1b538c90693d07dcc048eaf047dabd6822f7e
    source_path: channels/telegram.md
    workflow: 15
---

جاهز للإنتاج للرسائل الخاصة بالروبوت والمجموعات عبر grammY. يُعد الاستطلاع الطويل الوضع الافتراضي؛ ووضع Webhook اختياري.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    سياسة الرسائل الخاصة الافتراضية في Telegram هي الاقتران.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وأدلة إصلاح.
  </Card>
  <Card title="تهيئة Gateway" icon="settings" href="/ar/gateway/configuration">
    أنماط وأمثلة تهيئة القنوات الكاملة.
  </Card>
</CardGroup>

## الإعداد السريع

<Steps>
  <Step title="أنشئ رمز الروبوت في BotFather">
    افتح Telegram وابدأ محادثة مع **@BotFather** (تأكد من أن المعرّف هو `@BotFather` تمامًا).

    شغّل `/newbot`، واتبع المطالبات، واحفظ الرمز.

  </Step>

  <Step title="هيّئ الرمز وسياسة الرسائل الخاصة">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    بديل env: ‏`TELEGRAM_BOT_TOKEN=...` (للحساب الافتراضي فقط).
    لا يستخدم Telegram الأمر `openclaw channels login telegram`؛ قم بتهيئة الرمز في config/env، ثم شغّل Gateway.

  </Step>

  <Step title="شغّل Gateway ووافق على أول رسالة خاصة">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

  </Step>

  <Step title="أضف الروبوت إلى مجموعة">
    أضف الروبوت إلى مجموعتك، ثم اضبط `channels.telegram.groups` و`groupPolicy` بما يتوافق مع نموذج الوصول لديك.
  </Step>
</Steps>

<Note>
ترتيب تحليل الرمز مدرك للحساب. عمليًا، تفوز قيم config على بديل env، و`TELEGRAM_BOT_TOKEN` ينطبق فقط على الحساب الافتراضي.
</Note>

## إعدادات جهة Telegram

<AccordionGroup>
  <Accordion title="وضع الخصوصية ورؤية المجموعات">
    تعمل روبوتات Telegram افتراضيًا في **وضع الخصوصية**، مما يحد من رسائل المجموعات التي تتلقاها.

    إذا كان يجب أن يرى الروبوت جميع رسائل المجموعة، فإما:

    - عطّل وضع الخصوصية عبر `/setprivacy`، أو
    - اجعل الروبوت مشرفًا على المجموعة.

    عند تبديل وضع الخصوصية، أزل الروبوت ثم أعد إضافته إلى كل مجموعة حتى يطبق Telegram التغيير.

  </Accordion>

  <Accordion title="أذونات المجموعة">
    يتم التحكم في حالة المشرف من خلال إعدادات مجموعة Telegram.

    تتلقى الروبوتات المشرفة جميع رسائل المجموعة، وهو ما يفيد في سلوك المجموعات الدائم التشغيل.

  </Accordion>

  <Accordion title="خيارات BotFather المفيدة">

    - `/setjoingroups` للسماح/منع الإضافة إلى المجموعات
    - `/setprivacy` لسلوك رؤية المجموعات

  </Accordion>
</AccordionGroup>

## التحكم في الوصول والتفعيل

<Tabs>
  <Tab title="سياسة الرسائل الخاصة">
    يتحكم `channels.telegram.dmPolicy` في الوصول إلى الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist` (يتطلب معرّف مرسل واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن تحتوي `allowFrom` على `"*"`)
    - `disabled`

    يقبل `channels.telegram.allowFrom` معرّفات مستخدمي Telegram الرقمية. وتُقبل البادئتان `telegram:` / `tg:` وتتم تسويتهما.
    يحظر `dmPolicy: "allowlist"` مع `allowFrom` فارغة جميع الرسائل الخاصة وتُرفضه عملية التحقق من صحة config.
    يطلب الإعداد معرّفات المستخدمين الرقمية فقط.
    إذا قمت بالترقية وكان config لديك يحتوي على إدخالات قائمة سماح على شكل `@username`، فشغّل `openclaw doctor --fix` لحلها (بأفضل جهد؛ ويتطلب رمز روبوت Telegram).
    وإذا كنت تعتمد سابقًا على ملفات قائمة السماح في مخزن الاقتران، فيمكن للأمر `openclaw doctor --fix` استعادة الإدخالات إلى `channels.telegram.allowFrom` في تدفقات قائمة السماح (على سبيل المثال عندما لا يحتوي `dmPolicy: "allowlist"` بعد على معرّفات صريحة).

    لروبوتات المالك الواحد، يُفضّل استخدام `dmPolicy: "allowlist"` مع معرّفات `allowFrom` رقمية صريحة للحفاظ على سياسة الوصول ثابتة في config (بدلًا من الاعتماد على موافقات الاقتران السابقة).

    التباس شائع: الموافقة على اقتران الرسائل الخاصة لا تعني أن "هذا المرسل مخوّل في كل مكان".
    يمنح الاقتران الوصول إلى الرسائل الخاصة فقط. ولا يزال تخويل مرسل المجموعة يأتي من قوائم السماح الصريحة في config.
    إذا أردت أن يكون "أنا مخوّل مرة واحدة وتعمل الرسائل الخاصة وأوامر المجموعات معًا"، فضع معرّف مستخدم Telegram الرقمي الخاص بك في `channels.telegram.allowFrom`.

    ### العثور على معرّف مستخدم Telegram الخاص بك

    الطريقة الأكثر أمانًا (بدون روبوت خارجي):

    1. أرسل رسالة خاصة إلى الروبوت.
    2. شغّل `openclaw logs --follow`.
    3. اقرأ `from.id`.

    طريقة Bot API الرسمية:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    طريقة خارجية (خصوصية أقل): `@userinfobot` أو `@getidsbot`.

  </Tab>

  <Tab title="سياسة المجموعات وقوائم السماح">
    يُطبَّق عنصران معًا:

    1. **ما المجموعات المسموح بها** (`channels.telegram.groups`)
       - بدون تهيئة `groups`:
         - مع `groupPolicy: "open"`: يمكن لأي مجموعة اجتياز فحوصات معرّف المجموعة
         - مع `groupPolicy: "allowlist"` (الافتراضي): تُحظر المجموعات حتى تضيف إدخالات إلى `groups` (أو `"*"`)
       - عند تهيئة `groups`: تعمل كقائمة سماح (معرّفات صريحة أو `"*"`)

    2. **أي المرسلين مسموح بهم داخل المجموعات** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (افتراضي)
       - `disabled`

    يُستخدم `groupAllowFrom` لتصفية مرسلي المجموعات. وإذا لم يُضبط، يعود Telegram إلى `allowFrom`.
    يجب أن تكون إدخالات `groupAllowFrom` معرّفات مستخدمي Telegram رقمية (وتُسوّى البادئتان `telegram:` / `tg:`).
    لا تضع معرّفات دردشات مجموعات Telegram أو المجموعات الفائقة في `groupAllowFrom`. يجب وضع معرّفات الدردشة السالبة ضمن `channels.telegram.groups`.
    يتم تجاهل الإدخالات غير الرقمية لتخويل المرسلين.
    حد الأمان (`2026.2.25+`): لا يرث تخويل مرسل المجموعة موافقات مخزن اقتران الرسائل الخاصة.
    يظل الاقتران خاصًا بالرسائل الخاصة فقط. وبالنسبة إلى المجموعات، اضبط `groupAllowFrom` أو `allowFrom` لكل مجموعة/لكل موضوع.
    وإذا لم يُضبط `groupAllowFrom`، فسيعود Telegram إلى `allowFrom` في config، وليس إلى مخزن الاقتران.
    نمط عملي لروبوتات المالك الواحد: اضبط معرّف المستخدم الخاص بك في `channels.telegram.allowFrom`، واترك `groupAllowFrom` غير مضبوط، واسمح للمجموعات المستهدفة ضمن `channels.telegram.groups`.
    ملاحظة وقت التشغيل: إذا كان `channels.telegram` مفقودًا بالكامل، فإن القيم الافتراضية وقت التشغيل تصبح `groupPolicy="allowlist"` بشكل مغلق افتراضيًا ما لم يتم ضبط `channels.defaults.groupPolicy` صراحةً.

    مثال: السماح لأي عضو في مجموعة محددة واحدة:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    مثال: السماح لمستخدمين محددين فقط داخل مجموعة محددة واحدة:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      خطأ شائع: `groupAllowFrom` ليست قائمة سماح لمجموعات Telegram.

      - ضع معرّفات مجموعات Telegram أو المجموعات الفائقة السالبة مثل `-1001234567890` ضمن `channels.telegram.groups`.
      - ضع معرّفات مستخدمي Telegram مثل `8734062810` ضمن `groupAllowFrom` عندما تريد تقييد الأشخاص داخل مجموعة مسموح بها الذين يمكنهم تشغيل الروبوت.
      - استخدم `groupAllowFrom: ["*"]` فقط عندما تريد أن يتمكن أي عضو في مجموعة مسموح بها من التحدث إلى الروبوت.
    </Warning>

  </Tab>

  <Tab title="سلوك الإشارة">
    تتطلب الردود في المجموعات الإشارة افتراضيًا.

    يمكن أن تأتي الإشارة من:

    - إشارة أصلية `@botusername`، أو
    - أنماط الإشارة في:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    مفاتيح تبديل الأوامر على مستوى الجلسة:

    - `/activation always`
    - `/activation mention`

    تقوم هذه بتحديث حالة الجلسة فقط. استخدم config للاستمرارية.

    مثال على تهيئة دائمة:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    الحصول على معرّف دردشة المجموعة:

    - أعد توجيه رسالة من المجموعة إلى `@userinfobot` / `@getidsbot`
    - أو اقرأ `chat.id` من `openclaw logs --follow`
    - أو افحص Bot API ‏`getUpdates`

  </Tab>
</Tabs>

## سلوك وقت التشغيل

- Telegram مملوك لعملية Gateway.
- التوجيه حتمي: الردود الواردة من Telegram تُعاد إلى Telegram (لا يختار النموذج القنوات).
- تُسوّى الرسائل الواردة إلى غلاف القناة المشترك مع بيانات تعريف الرد وعناصر نائبة للوسائط.
- تُعزل جلسات المجموعات حسب معرّف المجموعة. وتُلحق موضوعات المنتدى `:topic:<threadId>` للحفاظ على عزل الموضوعات.
- يمكن أن تحمل رسائل DM القيمة `message_thread_id`; ويوجهها OpenClaw باستخدام مفاتيح جلسات مدركة للسلاسل ويحافظ على معرّف السلسلة للردود.
- يستخدم الاستطلاع الطويل grammY runner مع تسلسل لكل دردشة/لكل سلسلة. ويستخدم التوازي العام لمصب runner القيمة `agents.defaults.maxConcurrent`.
- تتم حماية الاستطلاع الطويل داخل كل عملية Gateway بحيث لا يمكن إلا لمستطلع نشط واحد استخدام رمز روبوت في الوقت نفسه. إذا كنت لا تزال ترى تعارضات `getUpdates` 409، فمن المحتمل أن تكون هناك بوابة OpenClaw أخرى أو نص برمجي أو مستطلع خارجي يستخدم الرمز نفسه.
- يتم تشغيل إعادة تشغيل مراقب الاستطلاع الطويل بعد 120 ثانية دون اكتمال نشاط `getUpdates` افتراضيًا. زد `channels.telegram.pollingStallThresholdMs` فقط إذا كان النشر لديك لا يزال يشهد عمليات إعادة تشغيل خاطئة بسبب تعطل الاستطلاع أثناء العمل طويل التشغيل. القيمة بالمللي ثانية، ومسموح بها من `30000` إلى `600000`; كما أن تجاوزات كل حساب مدعومة.
- لا يدعم Telegram Bot API إيصالات القراءة (`sendReadReceipts` لا ينطبق).

## مرجع الميزات

<AccordionGroup>
  <Accordion title="معاينة البث المباشر (تعديلات الرسائل)">
    يمكن لـ OpenClaw بث الردود الجزئية في الوقت الفعلي:

    - الدردشات المباشرة: رسالة معاينة + `editMessageText`
    - المجموعات/الموضوعات: رسالة معاينة + `editMessageText`

    المتطلب:

    - تكون قيمة `channels.telegram.streaming` هي `off | partial | block | progress` (الافتراضي: `partial`)
    - تُعيّن `progress` إلى `partial` على Telegram (للتوافق مع التسمية عبر القنوات)
    - يتحكم `streaming.preview.toolProgress` فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة المعدلة نفسها (الافتراضي: `true` عندما تكون معاينة البث نشطة)
    - يتم اكتشاف `channels.telegram.streamMode` القديمة وقيم `streaming` المنطقية؛ شغّل `openclaw doctor --fix` لترحيلها إلى `channels.telegram.streaming.mode`

    تحديثات معاينة تقدم الأداة هي أسطر "جارٍ العمل..." القصيرة التي تظهر أثناء تشغيل الأدوات، مثل تنفيذ الأوامر أو قراءات الملفات أو تحديثات التخطيط أو ملخصات التصحيح. يبقي Telegram هذه الميزة مفعلة افتراضيًا لمطابقة سلوك OpenClaw المُصدَر من `v2026.4.22` وما بعده. للاحتفاظ بمعاينة التعديل لنص الإجابة مع إخفاء أسطر تقدم الأداة، اضبط:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    استخدم `streaming.mode: "off"` فقط عندما تريد تعطيل تعديلات معاينة Telegram بالكامل. استخدم `streaming.preview.toolProgress: false` عندما تريد فقط تعطيل أسطر حالة تقدم الأداة.

    بالنسبة إلى الردود النصية فقط:

    - الرسائل الخاصة: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (بدون رسالة ثانية)
    - المجموعة/الموضوع: يحتفظ OpenClaw برسالة المعاينة نفسها ويجري تعديلًا نهائيًا في مكانها (بدون رسالة ثانية)

    بالنسبة إلى الردود المعقدة (مثل حمولات الوسائط)، يعود OpenClaw إلى التسليم النهائي العادي ثم ينظف رسالة المعاينة.

    معاينة البث منفصلة عن البث على مستوى الكتلة. وعندما يُفعَّل البث على مستوى الكتلة صراحةً في Telegram، يتجاوز OpenClaw بث المعاينة لتجنب البث المزدوج.

    إذا كان نقل المسودات الأصلي غير متاح/مرفوضًا، فسيعود OpenClaw تلقائيًا إلى `sendMessage` + `editMessageText`.

    بث الاستدلال الخاص بـ Telegram فقط:

    - يرسل `/reasoning stream` الاستدلال إلى المعاينة المباشرة أثناء التوليد
    - تُرسل الإجابة النهائية بدون نص الاستدلال

  </Accordion>

  <Accordion title="التنسيق وبديل HTML">
    يستخدم النص الصادر في Telegram القيمة `parse_mode: "HTML"`.

    - يُعرَض النص الشبيه بـ Markdown بصيغة HTML آمنة لـ Telegram.
    - يتم تحويل HTML الخام من النموذج إلى صيغة مُهربة لتقليل إخفاقات التحليل في Telegram.
    - إذا رفض Telegram تحليل HTML، يعيد OpenClaw المحاولة كنص عادي.

    تكون معاينات الروابط مفعلة افتراضيًا، ويمكن تعطيلها باستخدام `channels.telegram.linkPreview: false`.

  </Accordion>

  <Accordion title="الأوامر الأصلية والأوامر المخصصة">
    تتم معالجة تسجيل قائمة أوامر Telegram الأصلية عند بدء التشغيل باستخدام `setMyCommands`.

    الإعدادات الافتراضية للأوامر الأصلية:

    - `commands.native: "auto"` يفعّل الأوامر الأصلية لـ Telegram

    أضف إدخالات مخصصة إلى قائمة الأوامر:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "نسخة احتياطية عبر Git" },
        { command: "generate", description: "إنشاء صورة" },
      ],
    },
  },
}
```

    القواعد:

    - تتم تسوية الأسماء (إزالة الشرطة المائلة `/` في البداية، وأحرف صغيرة)
    - النمط الصالح: `a-z`، `0-9`، `_`، والطول `1..32`
    - لا يمكن للأوامر المخصصة تجاوز الأوامر الأصلية
    - يتم تخطي التعارضات/التكرارات وتسجيلها

    ملاحظات:

    - الأوامر المخصصة هي إدخالات قائمة فقط؛ ولا تنفذ السلوك تلقائيًا
    - يمكن أن تستمر أوامر Plugin/Skills في العمل عند كتابتها حتى لو لم تظهر في قائمة Telegram

    إذا تم تعطيل الأوامر الأصلية، فستُزال الأوامر المضمنة. وقد تستمر أوامر Plugin/الأوامر المخصصة في التسجيل إذا كانت مهيأة.

    إخفاقات الإعداد الشائعة:

    - يعني الخطأ `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن قائمة Telegram ما زالت ممتلئة بعد التقليص؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل `channels.telegram.commands.native`.
    - يعني الخطأ `setMyCommands failed` مع أخطاء الشبكة/fetch عادةً أن DNS/HTTPS الصادر إلى `api.telegram.org` محجوب.

    ### أوامر اقتران الأجهزة (Plugin ‏`device-pair`)

    عند تثبيت Plugin ‏`device-pair`:

    1. ينشئ `/pair` رمز إعداد
    2. الصق الرمز في تطبيق iOS
    3. يسرد `/pair pending` الطلبات المعلقة (بما في ذلك الدور/النطاقات)
    4. وافق على الطلب:
       - `/pair approve <requestId>` للموافقة الصريحة
       - `/pair approve` عندما يكون هناك طلب معلق واحد فقط
       - `/pair approve latest` لأحدث طلب

    يحمل رمز الإعداد رمز bootstrap قصير العمر. ويحافظ التسليم المضمن لـ bootstrap على رمز Node الأساسي عند `scopes: []`; كما يبقى أي رمز operator مُسلَّم مقيدًا بـ `operator.approvals` و`operator.read` و`operator.talk.secrets` و`operator.write`. وتكون عمليات التحقق من نطاق bootstrap مسبوقة بالدور، بحيث لا تلبّي قائمة السماح الخاصة بـ operator إلا طلبات operator؛ أما الأدوار غير operator فلا تزال تحتاج إلى نطاقات تحت بادئة دورها الخاص.

    إذا أعاد جهاز ما المحاولة مع تغيّر تفاصيل المصادقة (مثل الدور/النطاقات/المفتاح العام)، فسيتم استبدال الطلب المعلق السابق، ويستخدم الطلب الجديد `requestId` مختلفًا. أعد تشغيل `/pair pending` قبل الموافقة.

    مزيد من التفاصيل: [الاقتران](/ar/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="الأزرار المضمنة">
    هيّئ نطاق لوحة المفاتيح المضمنة:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    تجاوز لكل حساب:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    النطاقات:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (افتراضي)

    تُحوَّل الصيغة القديمة `capabilities: ["inlineButtons"]` إلى `inlineButtons: "all"`.

    مثال على إجراء رسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "اختر خيارًا:",
  buttons: [
    [
      { text: "نعم", callback_data: "yes" },
      { text: "لا", callback_data: "no" },
    ],
    [{ text: "إلغاء", callback_data: "cancel" }],
  ],
}
```

    تُمرَّر نقرات callback إلى الوكيل كنص:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="إجراءات رسائل Telegram للوكلاء والأتمتة">
    تتضمن إجراءات أداة Telegram ما يلي:

    - `sendMessage` (`to`, `content`, واختياريًا `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, واختياريًا `iconColor`, `iconCustomEmojiId`)

    تعرض إجراءات رسائل القناة أسماءً مستعارة سهلة الاستخدام (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    عناصر التحكم في التقييد:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (الافتراضي: معطل)

    ملاحظة: يتم تمكين `edit` و`topic-create` حاليًا افتراضيًا، ولا يملكان مفاتيح تبديل منفصلة من `channels.telegram.actions.*`.
    تستخدم عمليات الإرسال وقت التشغيل اللقطة النشطة من config/secrets (بدء التشغيل/إعادة التحميل)، لذلك لا تنفذ مسارات الإجراءات إعادة تحليل فورية لـ SecretRef لكل إرسال.

    دلالات إزالة التفاعل: [/tools/reactions](/ar/tools/reactions)

  </Accordion>

  <Accordion title="وسوم تشعيب الردود">
    يدعم Telegram وسوم تشعيب الردود الصريحة في المخرجات المولدة:

    - `[[reply_to_current]]` للرد على الرسالة المُشغِّلة
    - `[[reply_to:<id>]]` للرد على معرّف رسالة Telegram محدد

    يتحكم `channels.telegram.replyToMode` في المعالجة:

    - `off` (افتراضي)
    - `first`
    - `all`

    ملاحظة: يؤدي `off` إلى تعطيل تشعيب الرد الضمني. ولا تزال الوسوم الصريحة `[[reply_to_*]]` مُحترمة.

  </Accordion>

  <Accordion title="موضوعات المنتدى وسلوك السلاسل">
    في المجموعات الفائقة الخاصة بالمنتدى:

    - تُلحق مفاتيح جلسات الموضوع بـ `:topic:<threadId>`
    - تستهدف الردود وحالات الكتابة سلسلة الموضوع
    - مسار تهيئة الموضوع:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    الحالة الخاصة للموضوع العام (`threadId=1`):

    - تُرسل الرسائل بدون `message_thread_id` (يرفض Telegram ‏`sendMessage(...thread_id=1)`)
    - لا تزال إجراءات الكتابة تتضمن `message_thread_id`

    وراثة الموضوع: ترث إدخالات الموضوع إعدادات المجموعة ما لم يتم تجاوزها (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    يكون `agentId` خاصًا بالموضوع فقط ولا يُورث من الإعدادات الافتراضية للمجموعة.

    **توجيه الوكيل لكل موضوع**: يمكن لكل موضوع التوجيه إلى وكيل مختلف من خلال ضبط `agentId` في تهيئة الموضوع. وهذا يمنح كل موضوع مساحة عمل وذاكرة وجلسة معزولة خاصة به. مثال:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // الموضوع العام → الوكيل الرئيسي
                "3": { agentId: "zu" },        // موضوع التطوير → وكيل zu
                "5": { agentId: "coder" }      // مراجعة الكود → وكيل coder
              }
            }
          }
        }
      }
    }
    ```

    يصبح لكل موضوع بعد ذلك مفتاح جلسة خاص به: `agent:zu:telegram:group:-1001234567890:topic:3`

    **ربط ACP دائم للموضوع**: يمكن لموضوعات المنتدى تثبيت جلسات حزام ACP عبر روابط ACP مكتوبة على المستوى الأعلى (`bindings[]` مع `type: "acp"` و`match.channel: "telegram"` و`peer.kind: "group"` ومعرّف مؤهل بموضوع مثل `-1001234567890:topic:42`). يقتصر هذا حاليًا على موضوعات المنتدى في المجموعات/المجموعات الفائقة. راجع [وكلاء ACP](/ar/tools/acp-agents).

    **إنشاء ACP مرتبط بالسلسلة من الدردشة**: يربط `/acp spawn <agent> --thread here|auto` الموضوع الحالي بجلسة ACP جديدة؛ وتُوجَّه رسائل المتابعة إليها مباشرة. يثبّت OpenClaw تأكيد الإنشاء داخل الموضوع. ويتطلب ذلك `channels.telegram.threadBindings.spawnAcpSessions=true`.

    يعرض سياق القالب `MessageThreadId` و`IsForum`. وتحتفظ محادثات DM التي تحتوي على `message_thread_id` بتوجيه DM لكنها تستخدم مفاتيح جلسات مدركة للسلاسل.

  </Accordion>

  <Accordion title="الصوت والفيديو والملصقات">
    ### الرسائل الصوتية

    يميز Telegram بين الملاحظات الصوتية وملفات الصوت.

    - الافتراضي: سلوك ملف صوتي
    - الوسم `[[audio_as_voice]]` في رد الوكيل لفرض الإرسال كملاحظة صوتية

    مثال على إجراء رسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### رسائل الفيديو

    يميز Telegram بين ملفات الفيديو وملاحظات الفيديو.

    مثال على إجراء رسالة:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    لا تدعم ملاحظات الفيديو التسميات التوضيحية؛ ويُرسل نص الرسالة المقدم بشكل منفصل.

    ### الملصقات

    معالجة الملصقات الواردة:

    - WEBP ثابت: يُنزّل ويُعالج (عنصر نائب `<media:sticker>`)
    - TGS متحرك: يتم تخطيه
    - WEBM فيديو: يتم تخطيه

    حقول سياق الملصق:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    ملف ذاكرة التخزين المؤقت للملصقات:

    - `~/.openclaw/telegram/sticker-cache.json`

    يتم وصف الملصقات مرة واحدة (عندما يكون ذلك ممكنًا) وتُخزَّن مؤقتًا لتقليل استدعاءات الرؤية المتكررة.

    تمكين إجراءات الملصقات:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    إجراء إرسال ملصق:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    البحث في الملصقات المخزنة مؤقتًا:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="إشعارات التفاعل">
    تصل تفاعلات Telegram كتحديثات `message_reaction` (منفصلة عن حمولات الرسائل).

    عند التمكين، يضيف OpenClaw إلى قائمة الانتظار أحداث نظام مثل:

    - `تمت إضافة تفاعل Telegram: 👍 بواسطة Alice (@alice) على الرسالة 42`

    التهيئة:

    - `channels.telegram.reactionNotifications`: ‏`off | own | all` (الافتراضي: `own`)
    - `channels.telegram.reactionLevel`: ‏`off | ack | minimal | extensive` (الافتراضي: `minimal`)

    ملاحظات:

    - تعني `own` تفاعلات المستخدمين على الرسائل التي أرسلها الروبوت فقط (بأفضل جهد عبر ذاكرة التخزين المؤقت للرسائل المرسلة).
    - لا تزال أحداث التفاعل تحترم عناصر التحكم في الوصول الخاصة بـ Telegram (`dmPolicy` و`allowFrom` و`groupPolicy` و`groupAllowFrom`)؛ ويجري إسقاط المرسلين غير المخولين.
    - لا يوفر Telegram معرّفات سلاسل في تحديثات التفاعل.
      - في المجموعات غير المنتدى، يتم التوجيه إلى جلسة دردشة المجموعة
      - في مجموعات المنتدى، يتم التوجيه إلى جلسة الموضوع العام للمجموعة (`:topic:1`)، وليس إلى الموضوع الأصلي الدقيق

    تتضمن `allowed_updates` للاستطلاع/Webhook القيمة `message_reaction` تلقائيًا.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار بينما يعالج OpenClaw رسالة واردة.

    ترتيب التحليل:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - بديل الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يتوقع Telegram رموزًا تعبيرية Unicode (مثل "👀").
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات config من أحداث Telegram وأوامره">
    تكون كتابات config الخاصة بالقناة مفعلة افتراضيًا (`configWrites !== false`).

    تشمل الكتابات التي تُحفَّز من Telegram ما يلي:

    - أحداث ترحيل المجموعة (`migrate_to_chat_id`) لتحديث `channels.telegram.groups`
    - `/config set` و`/config unset` (يتطلب تمكين الأوامر)

    التعطيل:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="الاستطلاع الطويل مقابل Webhook">
    الوضع الافتراضي هو الاستطلاع الطويل. بالنسبة إلى وضع Webhook، اضبط `channels.telegram.webhookUrl` و`channels.telegram.webhookSecret`، مع `webhookPath` و`webhookHost` و`webhookPort` الاختيارية (الإعدادات الافتراضية `/telegram-webhook` و`127.0.0.1` و`8787`).

    يرتبط المستمع المحلي على `127.0.0.1:8787`. وللوصول العام الوارد، إما أن تضع وكيلًا عكسيًا أمام المنفذ المحلي أو تضبط `webhookHost: "0.0.0.0"` عن قصد.

    يتحقق وضع Webhook من حواجز الطلب، والرمز السري لـ Telegram، وجسم JSON قبل إعادة `200` إلى Telegram.
    ثم يعالج OpenClaw التحديث بشكل غير متزامن عبر مسارات الروبوت نفسها لكل دردشة/لكل موضوع المستخدمة في الاستطلاع الطويل، بحيث لا تؤخر دورات الوكيل البطيئة إشعار الاستلام الخاص بالتسليم من Telegram.

  </Accordion>

  <Accordion title="الحدود، وإعادة المحاولة، وأهداف CLI">
    - القيمة الافتراضية لـ `channels.telegram.textChunkLimit` هي 4000.
    - يفضّل `channels.telegram.chunkMode="newline"` حدود الفقرات (الأسطر الفارغة) قبل التقسيم حسب الطول.
    - يقيّد `channels.telegram.mediaMaxMb` (الافتراضي 100) حجم وسائط Telegram الواردة والصادرة.
    - يتجاوز `channels.telegram.timeoutSeconds` مهلة عميل API الخاص بـ Telegram (إذا لم يُضبط، تُطبّق القيمة الافتراضية لـ grammY).
    - القيمة الافتراضية لـ `channels.telegram.pollingStallThresholdMs` هي `120000`; ولا تضبطها بين `30000` و`600000` إلا لحالات إعادة التشغيل الخاطئة بسبب تعطل الاستطلاع.
    - يستخدم سجل سياق المجموعة `channels.telegram.historyLimit` أو `messages.groupChat.historyLimit` (الافتراضي 50); وتعطّل القيمة `0`.
    - يُمرَّر حاليًا السياق التكميلي للرد/الاقتباس/إعادة التوجيه كما استُلم.
    - تعمل قوائم السماح في Telegram أساسًا على تقييد من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.
    - عناصر التحكم في سجل DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - تنطبق تهيئة `channels.telegram.retry` على مساعدات إرسال Telegram ‏(CLI/الأدوات/الإجراءات) لأخطاء API الصادرة القابلة للاسترداد.

    يمكن أن يكون هدف الإرسال في CLI معرّف دردشة رقميًا أو اسم مستخدم:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    تستخدم استطلاعات Telegram الأمر `openclaw message poll` وتدعم موضوعات المنتدى:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    علامات الاستطلاع الخاصة بـ Telegram فقط:

    - `--poll-duration-seconds` ‏(5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` لموضوعات المنتدى (أو استخدم هدف `:topic:`)

    يدعم إرسال Telegram أيضًا:

    - `--presentation` مع كتل `buttons` للوحات المفاتيح المضمنة عندما يسمح `channels.telegram.capabilities.inlineButtons` بذلك
    - `--pin` أو `--delivery '{"pin":true}'` لطلب تسليم مثبت عندما يتمكن الروبوت من التثبيت في تلك الدردشة
    - `--force-document` لإرسال الصور وملفات GIF الصادرة كمستندات بدلًا من رفعها كصور مضغوطة أو وسائط متحركة

    تقييد الإجراءات:

    - يؤدي `channels.telegram.actions.sendMessage=false` إلى تعطيل رسائل Telegram الصادرة، بما في ذلك الاستطلاعات
    - يؤدي `channels.telegram.actions.poll=false` إلى تعطيل إنشاء استطلاعات Telegram مع إبقاء الإرسال العادي مفعّلًا

  </Accordion>

  <Accordion title="موافقات exec في Telegram">
    يدعم Telegram موافقات exec في الرسائل الخاصة للمعتمدين، ويمكنه اختياريًا نشر المطالبات في الدردشة أو الموضوع الأصلي. يجب أن يكون المعتمدون معرّفات مستخدمي Telegram رقمية.

    مسار التهيئة:

    - `channels.telegram.execApprovals.enabled` (يتم تفعيله تلقائيًا عندما يكون هناك معتمِد واحد على الأقل قابل للتحليل)
    - `channels.telegram.execApprovals.approvers` (يعود إلى معرّفات المالك الرقمية من `allowFrom` / `defaultTo`)
    - `channels.telegram.execApprovals.target`: ‏`dm` (افتراضي) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    يُظهر التسليم عبر القناة نص الأمر في الدردشة؛ فعّل `channel` أو `both` فقط في المجموعات/الموضوعات الموثوقة. وعندما تصل المطالبة إلى موضوع منتدى، يحافظ OpenClaw على الموضوع لمطالبة الموافقة وللمتابعة. تنتهي صلاحية موافقات exec بعد 30 دقيقة افتراضيًا.

    تتطلب أزرار الموافقة المضمنة أيضًا أن يسمح `channels.telegram.capabilities.inlineButtons` بالسطح المستهدف (`dm` أو `group` أو `all`). وتُحل معرّفات الموافقة المسبوقة بـ `plugin:` عبر موافقات Plugin؛ أما غير ذلك فيُحل أولًا عبر موافقات exec.

    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## عناصر التحكم في ردود الأخطاء

عندما يواجه الوكيل خطأ في التسليم أو المزود، يمكن لـ Telegram إما الرد بنص الخطأ أو كتمه. يتحكم مفتاحا config التاليان في هذا السلوك:

| المفتاح                                 | القيم            | الافتراضي | الوصف                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | ترسل `reply` رسالة خطأ ودية إلى الدردشة. وتمنع `silent` ردود الأخطاء بالكامل. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | الحد الأدنى للوقت بين ردود الأخطاء في الدردشة نفسها. يمنع الإغراق بالأخطاء أثناء الانقطاعات.        |

تدعم التجاوزات لكل حساب، ولكل مجموعة، ولكل موضوع (بنفس وراثة مفاتيح تهيئة Telegram الأخرى).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // كتم الأخطاء في هذه المجموعة
        },
      },
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الروبوت لا يرد على رسائل المجموعات التي لا تحتوي على إشارة">

    - إذا كانت `requireMention=false`، فيجب أن يسمح وضع الخصوصية في Telegram بالرؤية الكاملة.
      - BotFather: ‏`/setprivacy` -> تعطيل
      - ثم أزل الروبوت وأعد إضافته إلى المجموعة
    - يحذر `openclaw channels status` عندما تتوقع التهيئة رسائل مجموعات دون إشارة.
    - يمكن لـ `openclaw channels status --probe` التحقق من معرّفات مجموعات رقمية صريحة؛ ولا يمكن التحقق من العضوية باستخدام المحرف العام `"*"`.
    - اختبار جلسة سريع: `/activation always`.

  </Accordion>

  <Accordion title="الروبوت لا يرى رسائل المجموعات إطلاقًا">

    - عندما يكون `channels.telegram.groups` موجودًا، يجب إدراج المجموعة (أو تضمين `"*"`)
    - تحقق من عضوية الروبوت في المجموعة
    - راجع السجلات: `openclaw logs --follow` لمعرفة أسباب التخطي

  </Accordion>

  <Accordion title="الأوامر تعمل جزئيًا أو لا تعمل إطلاقًا">

    - خوّل هوية المرسل الخاصة بك (الاقتران و/أو `allowFrom` الرقمية)
    - لا يزال تخويل الأوامر يُطبّق حتى عندما تكون سياسة المجموعة `open`
    - يعني الخطأ `setMyCommands failed` مع `BOT_COMMANDS_TOO_MUCH` أن القائمة الأصلية تحتوي على عدد كبير جدًا من الإدخالات؛ قلّل أوامر Plugin/Skills/الأوامر المخصصة أو عطّل القوائم الأصلية
    - يشير الخطأ `setMyCommands failed` مع أخطاء الشبكة/fetch عادةً إلى مشكلات في وصول DNS/HTTPS إلى `api.telegram.org`

  </Accordion>

  <Accordion title="عدم استقرار الاستطلاع أو الشبكة">

    - قد يؤدي Node 22+ مع fetch/proxy مخصص إلى سلوك إيقاف فوري إذا لم تتطابق أنواع AbortSignal.
    - تحل بعض المضيفات `api.telegram.org` إلى IPv6 أولًا؛ ويمكن أن يسبب خروج IPv6 المعطل إخفاقات متقطعة في Telegram API.
    - إذا تضمنت السجلات `TypeError: fetch failed` أو `Network request for 'getUpdates' failed!`، فإن OpenClaw يعيد الآن محاولة هذه الحالات بوصفها أخطاء شبكة قابلة للاسترداد.
    - إذا تضمنت السجلات `Polling stall detected`، يعيد OpenClaw تشغيل الاستطلاع ويعيد بناء نقل Telegram بعد 120 ثانية دون اكتمال نشاط الاستطلاع الطويل افتراضيًا.
    - زد `channels.telegram.pollingStallThresholdMs` فقط عندما تكون استدعاءات `getUpdates` الطويلة سليمة لكن مضيفك لا يزال يبلغ عن عمليات إعادة تشغيل خاطئة بسبب تعطل الاستطلاع. وتشير حالات التعطل المستمرة عادةً إلى مشكلات في proxy أو DNS أو IPv6 أو خروج TLS بين المضيف و`api.telegram.org`.
    - في مضيفات VPS ذات الخروج المباشر/TLS غير المستقر، وجّه استدعاءات Telegram API عبر `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - يستخدم Node 22+ افتراضيًا `autoSelectFamily=true` (باستثناء WSL2) و`dnsResultOrder=ipv4first`.
    - إذا كان مضيفك WSL2 أو يعمل صراحةً بشكل أفضل مع سلوك IPv4 فقط، فافرض اختيار العائلة:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - إن إجابات نطاقات القياس RFC 2544 ‏(`198.18.0.0/15`) مسموح بها بالفعل
      افتراضيًا لتنزيلات وسائط Telegram. وإذا كان fake-IP موثوقًا أو
      proxy شفافًا يعيد كتابة `api.telegram.org` إلى عنوان آخر
      خاص/داخلي/للاستخدام الخاص أثناء تنزيلات الوسائط، فيمكنك
      تفعيل تجاوز Telegram فقط التالي:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - يتوفر التفعيل الاختياري نفسه لكل حساب في
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - إذا كان proxy لديك يحل مضيفي وسائط Telegram إلى `198.18.x.x`، فاترك
      العلامة الخطرة معطلة أولًا. إذ تسمح وسائط Telegram بالفعل بنطاق RFC 2544
      المعياري افتراضيًا.

    <Warning>
      يضعف `channels.telegram.network.dangerouslyAllowPrivateNetwork` حماية SSRF
      الخاصة بوسائط Telegram. استخدمه فقط في بيئات proxy موثوقة يتحكم فيها المشغل
      مثل Clash أو Mihomo أو Surge عند قيامها
      بتركيب إجابات خاصة أو للاستخدام الخاص خارج نطاق RFC 2544
      المعياري. اتركه معطّلًا للوصول المعتاد إلى Telegram عبر الإنترنت العام.
    </Warning>

    - تجاوزات البيئة (مؤقتة):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - تحقق من إجابات DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

مزيد من المساعدة: [استكشاف أخطاء القناة وإصلاحها](/ar/channels/troubleshooting).

## مرجع التهيئة

المرجع الأساسي: [مرجع التهيئة - Telegram](/ar/gateway/config-channels#telegram).

<Accordion title="حقول Telegram عالية الأهمية">

- بدء التشغيل/المصادقة: `enabled`, `botToken`, `tokenFile`, `accounts.*` (يجب أن يشير `tokenFile` إلى ملف عادي؛ وتُرفض الروابط الرمزية)
- التحكم في الوصول: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` على المستوى الأعلى (`type: "acp"`)
- موافقات exec: ‏`execApprovals`, `accounts.*.execApprovals`
- الأوامر/القائمة: `commands.native`, `commands.nativeSkills`, `customCommands`
- السلاسل/الردود: `replyToMode`
- البث: `streaming` (المعاينة)، `streaming.preview.toolProgress`, `blockStreaming`
- التنسيق/التسليم: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- الوسائط/الشبكة: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: ‏`webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- الإجراءات/الإمكانات: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- التفاعلات: `reactionNotifications`, `reactionLevel`
- الأخطاء: `errorPolicy`, `errorCooldownMs`
- الكتابات/السجل: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
أولوية الحسابات المتعددة: عندما تكون هناك هوية حسابين أو أكثر مهيأة، اضبط `channels.telegram.defaultAccount` (أو ضمّن `channels.telegram.accounts.default`) لجعل التوجيه الافتراضي صريحًا. وإلا فسيعود OpenClaw إلى أول معرّف حساب مُسوّى، وسيُصدر `openclaw doctor` تحذيرًا. ترث الحسابات المسماة `channels.telegram.allowFrom` / `groupAllowFrom`، لكنها لا ترث قيم `accounts.default.*`.
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقتران مستخدم Telegram بـ Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك قائمة السماح للمجموعات والموضوعات.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    توجيه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="توجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    ربط المجموعات والموضوعات بالوكلاء.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات.
  </Card>
</CardGroup>
