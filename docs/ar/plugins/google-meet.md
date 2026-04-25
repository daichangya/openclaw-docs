---
read_when:
    - تريد أن ينضم وكيل OpenClaw إلى مكالمة Google Meet
    - تريد أن ينشئ وكيل OpenClaw مكالمة Google Meet جديدة
    - أنت تقوم بتهيئة Chrome أو Chrome node أو Twilio كوسيلة نقل لـ Google Meet
summary: 'Plugin ‏Google Meet: الانضمام إلى عناوين URL صريحة لاجتماعات Meet عبر Chrome أو Twilio مع الإعدادات الافتراضية للصوت الآني'
title: Plugin ‏Google Meet
x-i18n:
    generated_at: "2026-04-25T13:52:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3329ea25e94eb20403464d041cd34de731b7620deeac6b32248655e885cd3729
    source_path: plugins/google-meet.md
    workflow: 15
---

دعم المشاركين في Google Meet لـ OpenClaw — صُمم Plugin ليكون صريحًا:

- لا ينضم إلا إلى عنوان URL صريح من نوع `https://meet.google.com/...`.
- يمكنه إنشاء مساحة Meet جديدة عبر Google Meet API، ثم الانضمام إلى
  عنوان URL المعاد.
- يكون الصوت `realtime` هو الوضع الافتراضي.
- يمكن للصوت الآني أن يعاود استدعاء وكيل OpenClaw الكامل عندما تكون هناك حاجة
  إلى استدلال أعمق أو أدوات.
- تختار الوكلاء سلوك الانضمام باستخدام `mode`: استخدم `realtime` للاستماع/الرد
  الحي، أو `transcribe` للانضمام/التحكم في المتصفح من دون جسر الصوت
  الآني.
- تبدأ المصادقة إما من Google OAuth شخصي أو من ملف Chrome شخصي
  مسجل الدخول بالفعل.
- لا يوجد إعلان موافقة تلقائي.
- تكون بيئة الصوت الافتراضية في Chrome هي `BlackHole 2ch`.
- يمكن أن يعمل Chrome محليًا أو على مضيف Node مقترن.
- يقبل Twilio رقم اتصال هاتفي بالإضافة إلى PIN اختياري أو تسلسل DTMF.
- أمر CLI هو `googlemeet`؛ أما `meet` فهو محجوز لتدفقات عمل أوسع
  للمؤتمرات الهاتفية الخاصة بالوكيل.

## البدء السريع

ثبّت تبعيات الصوت المحلية وهيّئ موفر صوت آني في backend.
يكون OpenAI هو الافتراضي؛ كما يعمل Google Gemini Live مع
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

يقوم `blackhole-2ch` بتثبيت جهاز الصوت الافتراضي `BlackHole 2ch`. ويتطلب
مثبّت Homebrew إعادة تشغيل قبل أن يكشف macOS عن الجهاز:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقّق من الجزأين:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

فعّل Plugin:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

تحقق من الإعداد:

```bash
openclaw googlemeet setup
```

خَرْج الإعداد مخصص ليكون قابلاً للقراءة من قبل الوكيل. فهو يبلّغ عن ملف Chrome الشخصي،
وجسر الصوت، وتثبيت node، ومقدمة realtime المؤجلة، وعندما يتم تكوين تفويض Twilio،
ما إذا كان Plugin ‏`voice-call` وبيانات اعتماد Twilio جاهزين.
تعامل مع أي فحص `ok: false` على أنه عائق قبل أن تطلب من وكيل الانضمام.
استخدم `openclaw googlemeet setup --json` للنصوص البرمجية أو الخرج القابل للقراءة آليًا.

انضم إلى اجتماع:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو دع وكيلًا ينضم عبر أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

أنشئ اجتماعًا جديدًا وانضم إليه:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

أنشئ عنوان URL فقط من دون الانضمام:

```bash
openclaw googlemeet create --no-join
```

يمتلك `googlemeet create` مسارين:

- الإنشاء عبر API: يُستخدم عندما تكون بيانات اعتماد Google Meet OAuth مهيأة. وهذا
  هو المسار الأكثر حتمية ولا يعتمد على حالة واجهة المتصفح.
- التراجع إلى المتصفح: يُستخدم عندما تكون بيانات اعتماد OAuth غائبة. يستخدم OpenClaw
  Chrome node المثبت، ويفتح `https://meet.google.com/new`، وينتظر حتى تعيد
  Google التوجيه إلى عنوان URL حقيقي برمز اجتماع، ثم يعيد هذا العنوان. يتطلب
  هذا المسار أن يكون ملف OpenClaw Chrome الشخصي على العقدة مسجل الدخول بالفعل إلى Google.
  تتعامل أتمتة المتصفح مع مطالبة الميكروفون الخاصة بالتشغيل الأول في Meet؛ ولا تُعامل
  هذه المطالبة على أنها فشل في تسجيل الدخول إلى Google.
  تحاول تدفقات الانضمام والإنشاء أيضًا إعادة استخدام علامة تبويب Meet موجودة قبل فتح
  علامة جديدة. وتتجاهل المطابقة سلاسل استعلام URL غير المؤذية مثل `authuser`، حتى يركّز
  تكرار الوكيل على الاجتماع المفتوح بالفعل بدلًا من إنشاء علامة تبويب Chrome ثانية.

يتضمن خرج الأمر/الأداة حقل `source` ‏(`api` أو `browser`) حتى يتمكن الوكلاء
من شرح المسار المستخدم. ينضم `create` إلى الاجتماع الجديد افتراضيًا ويعيد
`joined: true` بالإضافة إلى جلسة الانضمام. ولإنشاء عنوان URL فقط، استخدم
`create --no-join` في CLI أو مرّر `"join": false` إلى الأداة.

أو أخبر وكيلًا: "أنشئ Google Meet، وانضم إليه بصوت realtime، وأرسل
لي الرابط." يجب أن يستدعي الوكيل `google_meet` مع `action: "create"` ثم
يشارك `meetingUri` المعاد.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

وللانضمام بغرض المراقبة فقط/التحكم في المتصفح، اضبط `"mode": "transcribe"`. هذا
لا يبدأ جسر النموذج الآني ثنائي الاتجاه، لذلك لن يرد صوتيًا داخل
الاجتماع.

أثناء جلسات realtime، تتضمن حالة `google_meet` مؤشرات سلامة المتصفح وجسر الصوت
مثل `inCall` و`manualActionRequired` و`providerConnected` و
`realtimeReady` و`audioInputActive` و`audioOutputActive` وآخر طوابع
الإدخال/الإخراج الزمنية، وعدّادات البايتات، وحالة إغلاق الجسر. إذا ظهرت مطالبة آمنة
من صفحة Meet، تتعامل معها أتمتة المتصفح عندما تستطيع. ويتم الإبلاغ عن
مطالبات تسجيل الدخول، وقبول المضيف، وأذونات المتصفح/نظام التشغيل كإجراء يدوي مع سبب
ورسالة لكي ينقلها الوكيل.

ينضم Chrome باستخدام ملف Chrome الشخصي المسجل الدخول. في Meet، اختر
`BlackHole 2ch` لمسار الميكروفون/السماعة الذي يستخدمه OpenClaw. وللحصول على صوت ثنائي
نظيف، استخدم أجهزة افتراضية منفصلة أو مخططًا على نمط Loopback؛ فجهاز
BlackHole واحد يكفي لاختبار smoke أولي لكنه قد يسبب صدى.

### Gateway محلي + Chrome في Parallels

أنت **لا** تحتاج إلى Gateway كامل من OpenClaw أو مفتاح API للنموذج داخل macOS VM
فقط لكي تمتلك VM متصفح Chrome. شغّل Gateway والوكيل محليًا، ثم شغّل
مضيف node داخل VM. فعّل Plugin المضمن على VM مرة واحدة حتى تعلن
العقدة عن أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: ‏OpenClaw Gateway، ومساحة عمل الوكيل، ومفاتيح النموذج/API، وموفر
  realtime، وإعداد Plugin ‏Google Meet.
- macOS VM في Parallels: ‏OpenClaw CLI/node host، وGoogle Chrome، وSoX، وBlackHole 2ch،
  وملف Chrome شخصي مسجل الدخول إلى Google.
- غير مطلوب في VM: خدمة Gateway، أو إعداد الوكيل، أو مفتاح OpenAI/GPT، أو إعداد
  موفر النموذج.

ثبّت تبعيات VM:

```bash
brew install blackhole-2ch sox
```

أعد تشغيل VM بعد تثبيت BlackHole حتى يكشف macOS عن `BlackHole 2ch`:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقّق من أن VM تستطيع رؤية جهاز الصوت وأوامر SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

ثبّت OpenClaw أو حدّثه في VM، ثم فعّل Plugin المضمن هناك:

```bash
openclaw plugins enable google-meet
```

ابدأ تشغيل مضيف node في VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان IP على LAN ولم تكن تستخدم TLS، فسترفض العقدة
WebSocket النصي ما لم تشترك صراحة في تلك الشبكة الخاصة الموثوقة:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

استخدم متغير البيئة نفسه عند تثبيت العقدة كـ LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

إن `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` هو بيئة عملية، وليس
إعدادًا في `openclaw.json`. يقوم `openclaw node install` بتخزينه في بيئة
LaunchAgent عندما يكون موجودًا في أمر التثبيت.

وافق على العقدة من مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

أكد أن Gateway ترى العقدة وأنها تعلن عن كل من `googlemeet.chrome`
وإمكانية المتصفح/`browser.proxy`:

```bash
openclaw nodes status
```

وجّه Meet عبر تلك العقدة على مضيف Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

يمكنك الآن الانضمام بشكل طبيعي من مضيف Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو اطلب من الوكيل استخدام أداة `google_meet` مع `transport: "chrome-node"`.

ولإجراء اختبار smoke بأمر واحد ينشئ جلسة أو يعيد استخدامها، وينطق
عبارة معروفة، ويطبع سلامة الجلسة:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

أثناء الانضمام، تقوم أتمتة متصفح OpenClaw بملء اسم الضيف، والنقر على Join/Ask
to join، وقبول خيار "Use microphone" الخاص بالتشغيل الأول في Meet عندما
تظهر هذه المطالبة. وخلال إنشاء الاجتماع عبر المتصفح فقط، يمكنها أيضًا
المتابعة بعد المطالبة نفسها من دون ميكروفون إذا لم يُظهر Meet زر
استخدام الميكروفون. إذا لم يكن ملف المتصفح الشخصي مسجل الدخول، أو كان Meet ينتظر
قبول المضيف، أو كان Chrome يحتاج إلى إذن الميكروفون/الكاميرا، أو كان Meet عالقًا عند
مطالبة لم تتمكن الأتمتة من حلها، فإن نتيجة join/test-speech تُبلغ عن
`manualActionRequired: true` مع `manualActionReason` و
`manualActionMessage`. يجب على الوكلاء التوقف عن إعادة محاولة الانضمام،
وإبلاغ الرسالة الدقيقة بالإضافة إلى `browserUrl`/`browserTitle` الحالية،
وإعادة المحاولة فقط بعد اكتمال الإجراء اليدوي في المتصفح.

إذا تم حذف `chromeNode.node`، فسيختار OpenClaw تلقائيًا فقط عندما تعلن
عقدة متصلة واحدة بالضبط عن كل من `googlemeet.chrome` والتحكم في المتصفح. وإذا
كانت عدة عقد قادرة متصلة، فاضبط `chromeNode.node` على معرّف العقدة،
أو اسم العرض، أو IP البعيد.

فحوصات الأعطال الشائعة:

- `No connected Google Meet-capable node`: ابدأ `openclaw node run` في VM،
  ووافق على الاقتران، وتأكد من تشغيل `openclaw plugins enable google-meet` و
  `openclaw plugins enable browser` في VM. وتأكد أيضًا من أن
  مضيف Gateway يسمح بأمري العقدة كليهما باستخدام
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch`
  في VM وأعد تشغيل VM.
- يفتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى ملف المتصفح الشخصي داخل VM، أو
  أبقِ `chrome.guestName` مضبوطًا لانضمام الضيف. يستخدم الانضمام التلقائي كضيف أتمتة متصفح
  OpenClaw عبر وكيل متصفح العقدة؛ تأكد من أن إعداد متصفح العقدة يشير إلى الملف
  الشخصي الذي تريده، مثل
  `browser.defaultProfile: "user"` أو ملف جلسة موجودة مسمى.
- علامات تبويب Meet مكررة: اترك `chrome.reuseExistingTab: true` مفعّلًا. يقوم OpenClaw
  بتنشيط علامة تبويب موجودة لعنوان Meet نفسه قبل فتح علامة جديدة، كما يعيد
  إنشاء الاجتماعات عبر المتصفح استخدام علامة تبويب `https://meet.google.com/new` الجارية أو
  علامة تبويب مطالبة حساب Google قبل فتح أخرى.
- لا يوجد صوت: في Meet، وجّه الميكروفون/السماعة عبر مسار جهاز الصوت الافتراضي
  الذي يستخدمه OpenClaw؛ واستخدم أجهزة افتراضية منفصلة أو توجيهًا على نمط Loopback
  للحصول على صوت ثنائي نظيف.

## ملاحظات التثبيت

يستخدم الافتراضي realtime في Chrome أداتين خارجيتين:

- `sox`: أداة صوت عبر سطر الأوامر. يستخدم Plugin الأمرين `rec` و`play`
  من أجل جسر الصوت الافتراضي G.711 mu-law بسرعة 8 kHz.
- `blackhole-2ch`: برنامج تشغيل صوت افتراضي لـ macOS. ينشئ جهاز الصوت
  `BlackHole 2ch` الذي يمكن لـ Chrome/Meet التوجيه من خلاله.

لا يقوم OpenClaw بتجميع أي من الحزمتين أو إعادة توزيعهما. وتطلب المستندات من المستخدمين
تثبيتهما كتابعيات مضيف عبر Homebrew. إن SoX مرخص
بـ `LGPL-2.0-only AND GPL-2.0-only`؛ أما BlackHole فمرخص بـ GPL-3.0.
إذا كنت تبني مثبتًا أو appliance يضم BlackHole مع OpenClaw، فراجع
شروط الترخيص الأصلية لـ BlackHole أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

يفتح نقل Chrome عنوان URL الخاص بـ Meet في Google Chrome وينضم باستخدام ملف
Chrome الشخصي المسجل الدخول. وعلى macOS، يتحقق Plugin من وجود `BlackHole 2ch`
قبل التشغيل. وإذا تم تكوين ذلك، فإنه يشغّل أيضًا أمر فحص سلامة لجسر الصوت وأمر
بدء تشغيل قبل فتح Chrome. استخدم `chrome` عندما يكون Chrome/الصوت موجودين على مضيف Gateway؛
واستخدم `chrome-node` عندما يكون Chrome/الصوت موجودين على Node مقترنة مثل Parallels
macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت الميكروفون ومكبرات الصوت في Chrome عبر جسر الصوت المحلي لـ OpenClaw.
إذا لم يكن `BlackHole 2ch` مثبتًا، فسيفشل الانضمام مع خطأ إعداد
بدلًا من الانضمام بصمت من دون مسار صوتي.

### Twilio

يُعد نقل Twilio خطة اتصال صارمة مفوّضة إلى Plugin مكالمات الصوت. وهو
لا يحلّل صفحات Meet لاستخراج أرقام الهواتف.

استخدم هذا عندما لا تكون المشاركة عبر Chrome متاحة أو عندما تريد حلًا احتياطيًا
للاتصال الهاتفي. يجب أن يوفّر Google Meet رقم اتصال هاتفيًا ورمز PIN
للاجتماع؛ ولا يكتشف OpenClaw هذه المعلومات من صفحة Meet.

فعّل Plugin مكالمات الصوت على مضيف Gateway، وليس على Node الخاص بـ Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // أو عيّن "twilio" إذا كان يجب أن يكون Twilio هو الخيار الافتراضي
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

وفّر بيانات اعتماد Twilio عبر البيئة أو الإعدادات. إبقاءها في البيئة يحافظ على
الأسرار خارج `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

أعد تشغيل Gateway أو أعد تحميله بعد تفعيل `voice-call`؛ إذ إن تغييرات إعدادات Plugin
لا تظهر في عملية Gateway قيد التشغيل بالفعل حتى تُعاد تحميلها.

ثم تحقّق:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

عند اكتمال توصيل تفويض Twilio، سيتضمن `googlemeet setup`
فحوصات ناجحة لكل من `twilio-voice-call-plugin` و `twilio-voice-call-credentials`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

استخدم `--dtmf-sequence` عندما يحتاج الاجتماع إلى تسلسل مخصص:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth وفحوصات ما قبل التشغيل

يُعد OAuth اختياريًا لإنشاء رابط Meet لأن `googlemeet create` يمكنه
الرجوع إلى أتمتة المتصفح. قم بإعداد OAuth عندما تريد إنشاءً رسميًا عبر API،
أو تحليل المساحات، أو فحوصات ما قبل التشغيل لـ Meet Media API.

يستخدم الوصول إلى Google Meet API OAuth الخاص بالمستخدم: أنشئ عميل OAuth في Google Cloud،
واطلب النطاقات المطلوبة، ثم فوّض حساب Google، وبعد ذلك خزّن
رمز التحديث الناتج في إعدادات Plugin الخاصة بـ Google Meet أو وفّر
متغيرات البيئة `OPENCLAW_GOOGLE_MEET_*`.

لا يحل OAuth محل مسار الانضمام عبر Chrome. فما زالت عمليات النقل عبر Chrome وChrome-node
تنضم عبر ملف تعريف Chrome مسجّل الدخول، وBlackHole/SoX،
وNode متصل عند استخدام المشاركة عبر المتصفح. OAuth مخصص فقط
لمسار Google Meet API الرسمي: إنشاء مساحات الاجتماعات، وتحليل المساحات،
وتشغيل فحوصات ما قبل التشغيل لـ Meet Media API.

### إنشاء بيانات اعتماد Google

في Google Cloud Console:

1. أنشئ مشروع Google Cloud أو حدّد مشروعًا موجودًا.
2. فعّل **Google Meet REST API** لهذا المشروع.
3. اضبط شاشة الموافقة الخاصة بـ OAuth.
   - يكون **Internal** هو الأبسط لمؤسسة Google Workspace.
   - يعمل **External** للإعدادات الشخصية أو التجريبية؛ وبينما يكون التطبيق في وضع Testing،
     أضف كل حساب Google سيقوم بتفويض التطبيق باعتباره مستخدمًا تجريبيًا.
4. أضف النطاقات التي يطلبها OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. أنشئ معرّف عميل OAuth.
   - نوع التطبيق: **Web application**.
   - معرّف URI لإعادة التوجيه المصرّح به:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. انسخ معرّف العميل والسر الخاص بالعميل.

يُعد `meetings.space.created` مطلوبًا لـ Google Meet `spaces.create`.
ويتيح `meetings.space.readonly` لـ OpenClaw تحليل عناوين URL/الرموز الخاصة بـ Meet إلى مساحات.
أما `meetings.conference.media.readonly` فهو مخصص لفحوصات ما قبل التشغيل ووسائط
Meet Media API؛ وقد تطلب Google التسجيل في Developer Preview لاستخدام Media API فعليًا.
إذا كنت تحتاج فقط إلى الانضمام عبر Chrome المستند إلى المتصفح، فتخطَّ OAuth بالكامل.

### إصدار رمز التحديث

اضبط `oauth.clientId` واختياريًا `oauth.clientSecret`، أو مرّرهما على شكل
متغيرات بيئة، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع هذا الأمر كتلة إعداد `oauth` تتضمن رمز تحديث. وهو يستخدم PKCE،
واستدعاء localhost على `http://localhost:8085/oauth2callback`، وتدفقًا
يدويًا للنسخ/اللصق باستخدام `--manual`.

أمثلة:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

استخدم الوضع اليدوي عندما يتعذر على المتصفح الوصول إلى الاستدعاء المحلي:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

يتضمن خرج JSON ما يلي:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

خزّن كائن `oauth` ضمن إعدادات Plugin الخاصة بـ Google Meet:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

فضّل متغيرات البيئة إذا كنت لا تريد وضع رمز التحديث في الإعدادات.
إذا كانت قيم الإعدادات والبيئة موجودة معًا، فإن Plugin يحل قيم الإعدادات أولًا
ثم يستخدم البيئة كحل احتياطي.

تتضمن موافقة OAuth إنشاء مساحات Meet، والوصول للقراءة إلى مساحات Meet، والوصول
للقراءة إلى وسائط مؤتمر Meet. إذا كنت قد أجريت المصادقة قبل توفّر
دعم إنشاء الاجتماعات، فأعد تشغيل `openclaw googlemeet auth login --json` كي يحمل
رمز التحديث نطاق `meetings.space.created`.

### التحقق من OAuth باستخدام doctor

شغّل أداة OAuth doctor عندما تريد فحصًا سريعًا للحالة لا يكشف الأسرار:

```bash
openclaw googlemeet doctor --oauth --json
```

لا يقوم هذا بتحميل بيئة Chrome التشغيلية ولا يتطلب Node متصلًا لـ Chrome. بل
يتحقق من وجود إعدادات OAuth وأن رمز التحديث يمكنه إصدار رمز وصول.
يتضمن تقرير JSON حقول حالة فقط مثل `ok` و`configured` و`tokenSource`
و`expiresAt` ورسائل الفحص؛ ولا يطبع رمز الوصول أو رمز التحديث
أو سر العميل.

النتائج الشائعة:

| الفحص                | المعنى                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | وجود `oauth.clientId` مع `oauth.refreshToken`، أو وجود رمز وصول مخزّن مؤقتًا.          |
| `oauth-token`        | ما يزال رمز الوصول المخزّن المؤقت صالحًا، أو أن رمز التحديث أصدر رمز وصول جديدًا.      |
| `meet-spaces-get`    | فحص `--meeting` الاختياري حلّ مساحة Meet موجودة.                                       |
| `meet-spaces-create` | فحص `--create-space` الاختياري أنشأ مساحة Meet جديدة.                                   |

ولإثبات تفعيل Google Meet API ونطاق `spaces.create` أيضًا، شغّل
فحص الإنشاء ذي الأثر الجانبي:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

يقوم `--create-space` بإنشاء عنوان URL مؤقت لـ Meet. استخدمه عندما تحتاج إلى تأكيد
أن مشروع Google Cloud قد فعّل Meet API وأن الحساب المخوّل لديه
نطاق `meetings.space.created`.

ولإثبات صلاحية القراءة لمساحة اجتماع موجودة:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

يثبت `doctor --oauth --meeting` و`resolve-space` صلاحية القراءة لمساحة
موجودة يمكن لحساب Google المخوّل الوصول إليها. تشير استجابة `403` من هذه الفحوصات
غالبًا إلى أن Google Meet REST API معطّل، أو أن رمز التحديث الموافق عليه
يفتقد النطاق المطلوب، أو أن حساب Google لا يمكنه الوصول إلى تلك المساحة
في Meet. أما خطأ رمز التحديث فيعني ضرورة إعادة تشغيل `openclaw googlemeet auth login
--json` وتخزين كتلة `oauth` الجديدة.

لا حاجة إلى أي بيانات اعتماد OAuth للحل الاحتياطي عبر المتصفح. في هذا الوضع، تأتي
مصادقة Google من ملف تعريف Chrome المسجّل الدخول على Node المحدد، وليس من
إعدادات OpenClaw.

تُقبل متغيرات البيئة التالية كحلول احتياطية:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` أو `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` أو `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أو
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` أو `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` أو `GOOGLE_MEET_PREVIEW_ACK`

حلّل عنوان URL أو رمز Meet أو `spaces/{id}` عبر `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

شغّل فحص ما قبل التشغيل قبل العمل على الوسائط:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

اعرض عناصر الاجتماع وسجل الحضور بعد أن ينشئ Meet سجلات المؤتمر:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

باستخدام `--meeting`، يستخدم `artifacts` و`attendance` أحدث سجل مؤتمر
افتراضيًا. مرّر `--all-conference-records` عندما تريد كل سجل محفوظ
لهذا الاجتماع.

يمكن لبحث التقويم تحليل عنوان URL الخاص بالاجتماع من Google Calendar قبل قراءة
عناصر Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

يبحث `--today` في تقويم `primary` الخاص باليوم الحالي عن حدث Calendar يتضمن
رابط Google Meet. استخدم `--event <query>` للبحث في نص الحدث المطابق، و`--calendar <id>`
لتقويم غير أساسي. يتطلب بحث Calendar تسجيل دخول OAuth حديثًا يتضمن
نطاق القراءة فقط لأحداث Calendar.
يعرض `calendar-events` معاينة لأحداث Meet المطابقة ويضع علامة على الحدث الذي
ستختاره أوامر `latest` أو `artifacts` أو `attendance` أو `export`.

إذا كنت تعرف بالفعل معرّف سجل المؤتمر، فاستهدفه مباشرة:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

اكتب تقريرًا سهل القراءة:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

يعيد `artifacts` بيانات وصفية لسجل المؤتمر بالإضافة إلى البيانات الوصفية لموارد المشاركين، والتسجيل، والنص المفرغ،
ومدخلات النص المفرغ المنظّمة، والملاحظات الذكية عندما تتيحها
Google للاجتماع. استخدم `--no-transcript-entries` لتخطي
جلب المدخلات في الاجتماعات الكبيرة. ويحوّل `attendance` المشاركين إلى
صفوف participant-session مع أوقات أول وآخر ظهور، وإجمالي مدة الجلسة،
وعلامات التأخر/المغادرة المبكرة، ودمج موارد المشاركين المكررة حسب
المستخدم المسجّل دخوله أو اسم العرض. مرّر `--no-merge-duplicates` للإبقاء على
موارد المشاركين الخام منفصلة، و`--late-after-minutes` لضبط
اكتشاف التأخر، و`--early-before-minutes` لضبط
اكتشاف المغادرة المبكرة.

يكتب `export` مجلدًا يحتوي على `summary.md` و`attendance.csv`،
و`transcript.md` و`artifacts.json` و`attendance.json` و`manifest.json`.
ويسجّل `manifest.json` الإدخال المختار، وخيارات التصدير، وسجلات المؤتمر،
وملفات الإخراج، والأعداد، ومصدر الرمز، وحدث Calendar عند استخدامه،
وأي تحذيرات خاصة بالاسترجاع الجزئي. مرّر `--zip` لكتابة
أرشيف محمول أيضًا بجانب المجلد. مرّر `--include-doc-bodies` لتصدير نصوص
مستندات Google Docs المرتبطة بالنص المفرغ والملاحظات الذكية عبر Google Drive `files.export`؛ وهذا يتطلب
تسجيل دخول OAuth حديثًا يتضمن نطاق القراءة فقط الخاص بـ Drive Meet. من دون
`--include-doc-bodies`، تتضمن عمليات التصدير بيانات Meet الوصفية
ومدخلات النص المفرغ المنظّمة فقط. إذا أعادت Google فشلًا جزئيًا في العناصر،
مثل خطأ في قائمة الملاحظات الذكية أو مدخلات النص المفرغ أو جسم مستند Drive، فإن
الملخص وmanifest يحتفظان بالتحذير بدلًا من إفساد عملية التصدير بالكامل.
استخدم `--dry-run` لجلب بيانات العناصر/الحضور نفسها وطباعة
manifest JSON من دون إنشاء المجلد أو ملف ZIP. وهذا مفيد قبل كتابة
تصدير كبير أو عندما يحتاج الوكيل فقط إلى الأعداد، والسجلات المختارة،
والتحذيرات.

يمكن للوكلاء أيضًا إنشاء الحزمة نفسها عبر أداة `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

اضبط `"dryRun": true` لإرجاع manifest التصدير فقط وتخطي كتابة الملفات.

شغّل اختبار live smoke المحمي على اجتماع حقيقي محفوظ:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

بيئة live smoke:

- يفعّل `OPENCLAW_LIVE_TEST=1` اختبارات live المحمية.
- يشير `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` إلى عنوان URL أو رمز Meet محفوظ، أو
  `spaces/{id}`.
- يوفّر `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID` معرّف عميل OAuth.
- يوفّر `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
  رمز التحديث.
- اختياري: تستخدم `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`،
  و`OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`، و
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أسماء الحلول الاحتياطية نفسها
  من دون البادئة `OPENCLAW_`.

يتطلب live smoke الأساسي للعناصر/الحضور
`https://www.googleapis.com/auth/meetings.space.readonly` و
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. ويتطلب بحث Calendar
`https://www.googleapis.com/auth/calendar.events.readonly`. ويتطلب
تصدير أجسام مستندات Drive
`https://www.googleapis.com/auth/drive.meet.readonly`.

أنشئ مساحة Meet جديدة:

```bash
openclaw googlemeet create
```

يطبع الأمر `meeting uri` الجديد، والمصدر، وجلسة الانضمام. ومع
بيانات اعتماد OAuth يستخدم Google Meet API الرسمي. ومن دون بيانات اعتماد OAuth
يستخدم ملف تعريف المتصفح المسجّل دخوله في Node المثبّت كحل احتياطي. ويمكن للوكلاء
استخدام أداة `google_meet` مع `action: "create"` للإنشاء والانضمام في
خطوة واحدة. وللإنشاء بعنوان URL فقط، مرّر `"join": false`.

مثال على خرج JSON من الحل الاحتياطي عبر المتصفح:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

إذا اصطدم الحل الاحتياطي عبر المتصفح بتسجيل دخول Google أو بعائق أذونات Meet قبل
أن يتمكن من إنشاء عنوان URL، فستعيد طريقة Gateway استجابة فاشلة، كما أن
أداة `google_meet` تعيد تفاصيل منظّمة بدلًا من سلسلة نصية بسيطة:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

عندما يرى الوكيل `manualActionRequired: true`، يجب عليه الإبلاغ عن
`manualActionMessage` بالإضافة إلى سياق Node/التبويب الخاص بالمتصفح،
والتوقف عن فتح تبويبات Meet جديدة حتى يُكمل المشغّل خطوة المتصفح.

مثال على خرج JSON من الإنشاء عبر API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

يؤدي إنشاء Meet إلى الانضمام افتراضيًا. وما زال النقل عبر Chrome أو Chrome-node
يتطلب ملف تعريف Google Chrome مسجّل الدخول للانضمام عبر المتصفح. وإذا كان
ملف التعريف قد سجّل خروجه، فسيبلغ OpenClaw عن `manualActionRequired: true` أو
خطأ من الحل الاحتياطي عبر المتصفح، ويطلب من المشغّل إكمال تسجيل دخول Google قبل
إعادة المحاولة.

اضبط `preview.enrollmentAcknowledged: true` فقط بعد التأكد من أن مشروع Cloud
ومبدأ OAuth والمشاركين في الاجتماع مسجّلون في Google
Workspace Developer Preview Program لواجهات Meet media API.

## الإعدادات

لا يحتاج مسار Chrome الفوري الشائع إلا إلى تفعيل Plugin، وBlackHole، وSoX،
ومفتاح موفّر صوت فوري خلفي. OpenAI هو الافتراضي؛ اضبط
`realtime.provider: "google"` لاستخدام Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# أو
export GEMINI_API_KEY=...
```

اضبط إعدادات Plugin تحت `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

القيم الافتراضية:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: معرّف/اسم/IP اختياري لـ `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: الاسم المستخدم على شاشة ضيف Meet
  غير المسجّل دخوله
- `chrome.autoJoin: true`: أفضل جهد لملء اسم الضيف والنقر على Join Now
  عبر أتمتة متصفح OpenClaw على `chrome-node`
- `chrome.reuseExistingTab: true`: تفعيل تبويب Meet موجود بدلًا من
  فتح تبويبات مكررة
- `chrome.waitForInCallMs: 20000`: انتظار حتى يبلّغ تبويب Meet أنه داخل المكالمة
  قبل تشغيل مقدمة realtime
- `chrome.audioInputCommand`: أمر SoX `rec` يكتب صوت
  G.711 mu-law بتردد 8 kHz إلى stdout
- `chrome.audioOutputCommand`: أمر SoX `play` يقرأ صوت
  G.711 mu-law بتردد 8 kHz من stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود صوتية مختصرة، مع
  `openclaw_agent_consult` للإجابات الأعمق
- `realtime.introMessage`: فحص جاهزية صوتي قصير عند اتصال
  جسر realtime؛ اضبطه على `""` للانضمام بصمت

تجاوزات اختيارية:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

إعدادات خاصة بـ Twilio فقط:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

القيمة الافتراضية لـ `voiceCall.enabled` هي `true`؛ ومع نقل Twilio فإنه يفوّض
مكالمة PSTN الفعلية وDTMF إلى Plugin مكالمات الصوت. وإذا لم يكن `voice-call`
مفعّلًا، فسيظل Google Meet قادرًا على التحقق من خطة الاتصال وتسجيلها، لكنه
لن يتمكن من إجراء مكالمة Twilio.

## الأداة

يمكن للوكلاء استخدام أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

استخدم `transport: "chrome"` عندما يعمل Chrome على مضيف Gateway. واستخدم
`transport: "chrome-node"` عندما يعمل Chrome على Node مقترن مثل
آلة Parallels افتراضية. وفي كلتا الحالتين، يعمل نموذج realtime و`openclaw_agent_consult`
على مضيف Gateway، لذلك تبقى بيانات اعتماد النموذج هناك.

استخدم `action: "status"` لسرد الجلسات النشطة أو فحص معرّف جلسة. واستخدم
`action: "speak"` مع `sessionId` و`message` لجعل الوكيل الفوري
يتحدث فورًا. واستخدم `action: "test_speech"` لإنشاء الجلسة أو إعادة استخدامها،
وتشغيل عبارة معروفة، وإرجاع حالة `inCall` عندما يتمكن مضيف Chrome
من الإبلاغ عنها. واستخدم `action: "leave"` لوضع علامة انتهاء على الجلسة.

يتضمن `status` حالة Chrome عند توفرها:

- `inCall`: يبدو أن Chrome داخل مكالمة Meet
- `micMuted`: حالة ميكروفون Meet بأفضل جهد
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: يحتاج
  ملف تعريف المتصفح إلى تسجيل دخول يدوي، أو قبول من مضيف Meet، أو أذونات،
  أو إصلاح التحكم بالمتصفح قبل أن يعمل الكلام
- `providerConnected` / `realtimeReady`: حالة جسر الصوت الفوري
- `lastInputAt` / `lastOutputAt`: آخر صوت شوهد من الجسر أو أُرسل إليه

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## استشارة الوكيل الفوري

وُضع وضع Chrome الفوري لتحسين حلقة صوتية مباشرة. يسمع موفّر الصوت الفوري
صوت الاجتماع ويتحدث عبر جسر الصوت المُعدّ. وعندما يحتاج نموذج realtime
إلى استدلال أعمق، أو معلومات حالية، أو أدوات OpenClaw العادية، يمكنه
استدعاء `openclaw_agent_consult`.

تُشغّل أداة الاستشارة وكيل OpenClaw العادي في الخلفية مع سياق حديث
لنص الاجتماع المفرغ، وتعيد إجابة صوتية موجزة إلى جلسة الصوت الفورية. ويمكن
لنموذج الصوت بعد ذلك نطق تلك الإجابة مرة أخرى داخل الاجتماع.
وهي تستخدم أداة الاستشارة الفورية المشتركة نفسها مثل Voice Call.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: يكشف أداة الاستشارة ويقيّد الوكيل العادي إلى
  `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و
  `memory_get`.
- `owner`: يكشف أداة الاستشارة ويسمح للوكيل العادي باستخدام
  سياسة أدوات الوكيل العادية.
- `none`: لا يكشف أداة الاستشارة لنموذج الصوت الفوري.

نطاق مفتاح جلسة الاستشارة يكون لكل جلسة Meet، لذلك يمكن لمكالمات الاستشارة
اللاحقة إعادة استخدام سياق الاستشارة السابق أثناء الاجتماع نفسه.

لفرض فحص جاهزية منطوق بعد أن ينضم Chrome بالكامل إلى المكالمة:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

ولإجراء اختبار smoke الكامل للانضمام ثم التحدث:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## قائمة تحقق الاختبار الحي

استخدم هذا التسلسل قبل تسليم اجتماع إلى وكيل غير مراقب:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

الحالة المتوقعة لـ Chrome-node:

- `googlemeet setup` كله باللون الأخضر.
- يتضمن `googlemeet setup` الفحص `chrome-node-connected` عندما يكون Chrome-node هو
  النقل الافتراضي أو عندما يكون هناك Node مثبّت.
- يُظهر `nodes status` أن Node المحدد متصل.
- يعلن Node المحدد عن كل من `googlemeet.chrome` و`browser.proxy`.
- ينضم تبويب Meet إلى المكالمة ويُرجع `test-speech` حالة Chrome مع
  `inCall: true`.

بالنسبة إلى مضيف Chrome بعيد مثل آلة Parallels macOS افتراضية، فهذا هو أقصر
فحص آمن بعد تحديث Gateway أو الآلة الافتراضية:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

وهذا يثبت أن Plugin الخاص بـ Gateway محمّل، وأن Node الخاص بالآلة الافتراضية متصل
بالرمز الحالي، وأن جسر صوت Meet متاح قبل أن يفتح الوكيل تبويب اجتماع
حقيقي.

وبالنسبة إلى اختبار Twilio smoke، استخدم اجتماعًا يوفّر تفاصيل الاتصال الهاتفي:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

الحالة المتوقعة لـ Twilio:

- يتضمن `googlemeet setup` فحوصات خضراء لكل من `twilio-voice-call-plugin` و
  `twilio-voice-call-credentials`.
- يكون `voicecall` متاحًا في CLI بعد إعادة تحميل Gateway.
- تحتوي الجلسة المُعادة على `transport: "twilio"` و`twilio.voiceCallId`.
- يقوم `googlemeet leave <sessionId>` بإنهاء مكالمة الصوت المفوّضة.

## استكشاف الأخطاء وإصلاحها

### الوكيل لا يمكنه رؤية أداة Google Meet

تأكد من أن Plugin مفعّل في إعدادات Gateway وأعد تحميل Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

إذا كنت قد عدّلت للتو `plugins.entries.google-meet`، فأعد تشغيل Gateway أو أعد تحميله.
فالوكيل الجاري تشغيله لا يرى إلا أدوات Plugin المسجّلة بواسطة عملية
Gateway الحالية.

### لا يوجد Node متصل قادر على Google Meet

على مضيف Node، شغّل:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

على مضيف Gateway، وافق على Node وتحقق من الأوامر:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

يجب أن يكون Node متصلًا وأن يسرد `googlemeet.chrome` بالإضافة إلى `browser.proxy`.
كما يجب أن تسمح إعدادات Gateway بأوامر Node هذه:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

إذا فشل `googlemeet setup` في `chrome-node-connected` أو أبلغ سجل Gateway عن
`gateway token mismatch`، فأعد تثبيت Node أو أعد تشغيله باستخدام رمز Gateway
الحالي. وبالنسبة إلى Gateway على شبكة LAN، يعني هذا عادةً:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

ثم أعد تحميل خدمة Node وأعد تشغيل:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### المتصفح يفتح لكن الوكيل لا يمكنه الانضمام

شغّل `googlemeet test-speech` وافحص حالة Chrome المُعادة. إذا
أبلغت عن `manualActionRequired: true`، فاعرض `manualActionMessage` على المشغّل
وتوقف عن إعادة المحاولة حتى يكتمل إجراء المتصفح.

الإجراءات اليدوية الشائعة:

- سجّل الدخول إلى ملف تعريف Chrome.
- اقبل الضيف من حساب مضيف Meet.
- امنح Chrome أذونات الميكروفون/الكاميرا عندما يظهر
  طلب الأذونات الأصلي من Chrome.
- أغلق مربع حوار أذونات Meet العالق أو أصلحه.

لا تبلغ عن "عدم تسجيل الدخول" لمجرد أن Meet يعرض "Do you want people to
hear you in the meeting?" فهذا هو الفاصل البيني الخاص باختيار الصوت في Meet؛
ويقوم OpenClaw بالنقر على **Use microphone** عبر أتمتة المتصفح عند توفر ذلك
ويواصل الانتظار لحالة الاجتماع الحقيقية. وبالنسبة إلى الحل الاحتياطي عبر المتصفح للإنشاء فقط، قد
ينقر OpenClaw على **Continue without microphone** لأن إنشاء عنوان URL لا يحتاج
إلى مسار الصوت الفوري.

### فشل إنشاء الاجتماع

يستخدم `googlemeet create` أولًا نقطة النهاية `spaces.create` الخاصة بـ Google Meet API
عندما تكون بيانات اعتماد OAuth مضبوطة. ومن دون بيانات اعتماد OAuth يعود
إلى متصفح Chrome node المثبّت. تحقّق مما يلي:

- بالنسبة إلى الإنشاء عبر API: تم ضبط `oauth.clientId` و`oauth.refreshToken`،
  أو أن متغيرات البيئة المطابقة `OPENCLAW_GOOGLE_MEET_*` موجودة.
- بالنسبة إلى الإنشاء عبر API: تم إصدار رمز التحديث بعد إضافة
  دعم الإنشاء. قد تكون الرموز الأقدم تفتقد نطاق `meetings.space.created`؛ أعد تشغيل
  `openclaw googlemeet auth login --json` وحدّث إعدادات Plugin.
- بالنسبة إلى الحل الاحتياطي عبر المتصفح: يشير `defaultTransport: "chrome-node"` و
  `chromeNode.node` إلى Node متصل يحتوي على `browser.proxy` و
  `googlemeet.chrome`.
- بالنسبة إلى الحل الاحتياطي عبر المتصفح: يكون ملف تعريف OpenClaw Chrome على ذلك Node مسجّل الدخول
  إلى Google وقادرًا على فتح `https://meet.google.com/new`.
- بالنسبة إلى الحل الاحتياطي عبر المتصفح: تعيد المحاولات استخدام تبويب موجود لـ `https://meet.google.com/new`
  أو تبويب طلب حساب Google قبل فتح تبويب جديد. إذا انتهت مهلة وكيل،
  فأعد محاولة استدعاء الأداة بدلًا من فتح تبويب Meet آخر يدويًا.
- بالنسبة إلى الحل الاحتياطي عبر المتصفح: إذا أعادت الأداة `manualActionRequired: true`، فاستخدم
  `browser.nodeId` و`browser.targetId` و`browserUrl` و
  `manualActionMessage` المُعادة لإرشاد المشغّل. لا تُعد المحاولة في حلقة حتى
  يكتمل هذا الإجراء.
- بالنسبة إلى الحل الاحتياطي عبر المتصفح: إذا عرض Meet "Do you want people to hear you in the
  meeting?" فاترك التبويب مفتوحًا. ينبغي أن ينقر OpenClaw على **Use microphone** أو، في
  الحل الاحتياطي للإنشاء فقط، **Continue without microphone** عبر أتمتة
  المتصفح ويواصل انتظار عنوان URL الخاص بـ Meet الذي تم إنشاؤه. وإذا تعذّر عليه ذلك، فيجب أن
  يذكر الخطأ `meet-audio-choice-required` وليس `google-login-required`.

### الوكيل ينضم لكنه لا يتحدث

تحقق من مسار realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

استخدم `mode: "realtime"` للاستماع/الرد الصوتي. أما `mode: "transcribe"` فهو
لا يبدأ عمدًا جسر الصوت الفوري ثنائي الاتجاه.

تحقق أيضًا من:

- توفر مفتاح موفّر realtime على مضيف Gateway، مثل
  `OPENAI_API_KEY` أو `GEMINI_API_KEY`.
- ظهور `BlackHole 2ch` على مضيف Chrome.
- وجود `rec` و`play` على مضيف Chrome.
- توجيه ميكروفون Meet ومكبر الصوت عبر مسار الصوت الافتراضي الذي
  يستخدمه OpenClaw.

يطبع `googlemeet doctor [session-id]` الجلسة، وNode، وحالة داخل المكالمة،
وسبب الإجراء اليدوي، واتصال موفّر realtime، و`realtimeReady`،
ونشاط إدخال/إخراج الصوت، وآخر طوابع زمنية للصوت، وعدادات البايتات، وعنوان URL الخاص بالمتصفح.
استخدم `googlemeet status [session-id]` عندما تحتاج إلى JSON الخام. واستخدم
`googlemeet doctor --oauth` عندما تحتاج إلى التحقق من تحديث OAuth الخاص بـ Google Meet
من دون كشف الرموز؛ وأضف `--meeting` أو `--create-space` عندما تحتاج أيضًا إلى إثبات
Google Meet API.

إذا انتهت مهلة أحد الوكلاء وكنت ترى تبويب Meet مفتوحًا بالفعل، فافحص ذلك التبويب
من دون فتح تبويب آخر:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

إجراء الأداة المكافئ هو `recover_current_tab`. فهو يركّز ويفحص
تبويب Meet موجودًا على Chrome node المضبوط. ولا يفتح تبويبًا جديدًا أو
ينشئ جلسة جديدة؛ بل يبلغ عن المانع الحالي، مثل تسجيل الدخول، أو القبول،
أو الأذونات، أو حالة اختيار الصوت. ويتحدث أمر CLI إلى
Gateway المضبوط، لذلك يجب أن يكون Gateway قيد التشغيل ويجب أن يكون Chrome node متصلًا.

### فشل فحوصات إعداد Twilio

يفشل `twilio-voice-call-plugin` عندما لا يكون `voice-call` مسموحًا أو غير مفعّل.
أضفه إلى `plugins.allow`، وفعّل `plugins.entries.voice-call`، وأعد تحميل
Gateway.

يفشل `twilio-voice-call-credentials` عندما تكون واجهة Twilio الخلفية تفتقد معرّف الحساب
SID، أو رمز المصادقة، أو رقم المتصل. اضبط هذه القيم على مضيف Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

ثم أعد تشغيل Gateway أو أعد تحميله وشغّل:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

يكون `voicecall smoke` افتراضيًا للتحقق من الجاهزية فقط. ولإجراء dry-run على رقم محدد:

```bash
openclaw voicecall smoke --to "+15555550123"
```

لا تضف `--yes` إلا عندما تريد عمدًا إجراء
مكالمة إشعار حية صادرة:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### تبدأ مكالمة Twilio لكنها لا تدخل الاجتماع أبدًا

تأكد من أن حدث Meet يوفّر تفاصيل الاتصال الهاتفي. مرّر رقم الاتصال
ورمز PIN بدقة أو تسلسل DTMF مخصصًا:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

استخدم `w` في البداية أو الفواصل في `--dtmf-sequence` إذا كان الموفّر يحتاج إلى
توقف مؤقت قبل إدخال رمز PIN.

## ملاحظات

إن واجهة الوسائط الرسمية في Google Meet موجّهة للاستقبال، لذلك فإن التحدث داخل
مكالمة Meet ما زال يحتاج إلى مسار مشارك. ويحافظ هذا Plugin على وضوح هذا
الحد الفاصل:
يتولى Chrome المشاركة عبر المتصفح وتوجيه الصوت المحلي؛ ويتولى Twilio
المشاركة عبر الاتصال الهاتفي.

يحتاج وضع Chrome realtime إلى أحد الخيارين التاليين:

- `chrome.audioInputCommand` مع `chrome.audioOutputCommand`: يتولى OpenClaw
  جسر نموذج realtime وينقل صوت
  G.711 mu-law بتردد 8 kHz بين هذين
  الأمرين وموفّر الصوت الفوري المحدد.
- `chrome.audioBridgeCommand`: يتولى أمر جسر خارجي كامل مسار
  الصوت المحلي ويجب أن ينتهي بعد بدء daemon الخاص به أو التحقق منه.

للحصول على صوت ثنائي الاتجاه نظيف، وجّه خرج Meet وميكروفون Meet عبر أجهزة
افتراضية منفصلة أو عبر مخطط أجهزة افتراضية بأسلوب Loopback. إذ يمكن لجهاز
BlackHole مشترك واحد أن يعيد صدى المشاركين الآخرين إلى المكالمة.

يقوم `googlemeet speak` بتشغيل جسر الصوت الفوري النشط لجلسة Chrome.
ويقوم `googlemeet leave` بإيقاف ذلك الجسر. وبالنسبة إلى جلسات Twilio المفوّضة
عبر Plugin Voice Call، يقوم `leave` أيضًا بإنهاء مكالمة الصوت الأساسية.

## ذو صلة

- [Plugin مكالمات الصوت](/ar/plugins/voice-call)
- [وضع التحدث](/ar/nodes/talk)
- [بناء Plugins](/ar/plugins/building-plugins)
