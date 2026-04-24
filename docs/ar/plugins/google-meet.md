---
read_when:
    - تريد أن ينضم وكيل OpenClaw إلى مكالمة Google Meet
    - أنت تقوم بتكوين Chrome أو Chrome node أو Twilio كوسيلة نقل لـ Google Meet
summary: 'Plugin ‏Google Meet: انضم إلى عناوين URL الصريحة لاجتماعات Meet عبر Chrome أو Twilio باستخدام الإعدادات الافتراضية للصوت في الوقت الفعلي'
title: Plugin ‏Google Meet
x-i18n:
    generated_at: "2026-04-24T09:52:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1673ac4adc9cf163194a340dd6e451d0e4d28bb62adeb126898298e62106d43
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet ‏(Plugin)

دعم المشاركين في Google Meet لـ OpenClaw.

تم تصميم الـ Plugin ليكون صريحًا:

- لا ينضم إلا إلى عنوان URL صريح من `https://meet.google.com/...`.
- يكون الصوت `realtime` هو الوضع الافتراضي.
- يمكن للصوت في الوقت الفعلي الرجوع إلى وكيل OpenClaw الكامل عند الحاجة إلى استدلال أعمق أو أدوات.
- تبدأ المصادقة عبر Google OAuth الشخصي أو ملف Chrome شخصي مسجّل الدخول بالفعل.
- لا يوجد إعلان موافقة تلقائي.
- الواجهة الخلفية الصوتية الافتراضية لـ Chrome هي `BlackHole 2ch`.
- يمكن أن يعمل Chrome محليًا أو على مضيف Node مقترن.
- يقبل Twilio رقم اتصال هاتفي بالإضافة إلى PIN اختياري أو تسلسل DTMF.
- أمر CLI هو `googlemeet`؛ أما `meet` فهو محجوز لسير عمل المؤتمرات الهاتفية الأوسع للوكلاء.

## البدء السريع

ثبّت تبعيات الصوت المحلية وقم بتكوين موفّر صوت في الوقت الفعلي للواجهة الخلفية. OpenAI هو الافتراضي؛ كما يعمل Google Gemini Live أيضًا مع
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

يقوم `blackhole-2ch` بتثبيت جهاز الصوت الافتراضي `BlackHole 2ch`. يتطلب
مثبّت Homebrew إعادة تشغيل قبل أن يتيح macOS هذا الجهاز:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقّق من الجزأين كليهما:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

فعّل الـ Plugin:

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

تحقّق من الإعداد:

```bash
openclaw googlemeet setup
```

انضم إلى اجتماع:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو دع وكيلاً ينضم عبر أداة `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

ينضم Chrome باستخدام ملف Chrome الشخصي المسجّل الدخول. في Meet، اختر `BlackHole 2ch` لمسار الميكروفون/مكبر الصوت الذي يستخدمه OpenClaw. للحصول على صوت مزدوج نظيف، استخدم أجهزة افتراضية منفصلة أو مخططًا على نمط Loopback؛ يكفي جهاز BlackHole واحد لاختبار دخاني أولي لكنه قد يسبب صدى.

### Gateway محلي + Chrome على Parallels

أنت **لا** تحتاج إلى OpenClaw Gateway كامل أو مفتاح API للنموذج داخل VM على macOS فقط لكي يكون Chrome مملوكًا لـ VM. شغّل Gateway والوكيل محليًا، ثم شغّل مضيف Node داخل VM. فعّل الـ Plugin المضمّن على VM مرة واحدة حتى يعلن Node عن أمر Chrome:

ما الذي يعمل وأين:

- مضيف Gateway: OpenClaw Gateway ومساحة عمل الوكيل ومفاتيح النموذج/API وموفّر `realtime` وتكوين Plugin الخاص بـ Google Meet.
- Parallels macOS VM: OpenClaw CLI/مضيف Node وGoogle Chrome وSoX وBlackHole 2ch وملف Chrome شخصي مسجّل الدخول إلى Google.
- غير مطلوب داخل VM: خدمة Gateway أو تكوين الوكيل أو مفتاح OpenAI/GPT أو إعداد موفّر النموذج.

ثبّت تبعيات VM:

```bash
brew install blackhole-2ch sox
```

أعد تشغيل VM بعد تثبيت BlackHole حتى يتيح macOS جهاز `BlackHole 2ch`:

```bash
sudo reboot
```

بعد إعادة التشغيل، تحقّق من أن VM يمكنه رؤية جهاز الصوت وأوامر SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

ثبّت OpenClaw أو حدّثه داخل VM، ثم فعّل الـ Plugin المضمّن هناك:

```bash
openclaw plugins enable google-meet
```

ابدأ مضيف Node داخل VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

إذا كان `<gateway-host>` عنوان IP ضمن LAN ولم تكن تستخدم TLS، فسيرفض Node اتصال WebSocket النصي الصريح إلا إذا وافقت عليه لهذه الشبكة الخاصة الموثوقة:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

استخدم متغير البيئة نفسه عند تثبيت Node كـ LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

إن `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` هو متغير بيئة للعملية، وليس إعدادًا في
`openclaw.json`. يخزّن `openclaw node install` هذا المتغير في بيئة LaunchAgent
عندما يكون موجودًا في أمر التثبيت.

وافق على Node من مضيف Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

أكّد أن Gateway يرى Node وأنه يعلن عن `googlemeet.chrome`:

```bash
openclaw nodes status
```

وجّه Meet عبر ذلك Node على مضيف Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

الآن انضم بشكل عادي من مضيف Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

أو اطلب من الوكيل استخدام أداة `google_meet` مع `transport: "chrome-node"`.

إذا تم حذف `chromeNode.node`، فسيجري OpenClaw اختيارًا تلقائيًا فقط عندما يعلن Node واحد متصل بالضبط عن `googlemeet.chrome`. إذا كانت هناك عدة Nodes قادرة ومتّصلة، فاضبط `chromeNode.node` على معرّف Node أو اسمه المعروض أو عنوان IP البعيد.

فحوصات الأعطال الشائعة:

- `No connected Google Meet-capable node`: ابدأ `openclaw node run` داخل VM، ووافق على الاقتران، وتأكد من تشغيل `openclaw plugins enable google-meet` داخل VM. أكّد أيضًا أن مضيف Gateway يسمح بأمر Node باستخدام
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: ثبّت `blackhole-2ch`
  داخل VM وأعد تشغيل VM.
- يفتح Chrome لكنه لا يستطيع الانضمام: سجّل الدخول إلى Chrome داخل VM وأكّد أن ذلك الملف الشخصي يمكنه الانضمام إلى عنوان Meet URL يدويًا.
- لا يوجد صوت: في Meet، وجّه الميكروفون/مكبر الصوت عبر مسار جهاز الصوت الافتراضي الذي يستخدمه OpenClaw؛ استخدم أجهزة افتراضية منفصلة أو توجيهًا على نمط Loopback للحصول على صوت مزدوج نظيف.

## ملاحظات التثبيت

يستخدم وضع Chrome الافتراضي في الوقت الفعلي أداتين خارجيتين:

- `sox`: أداة صوت من سطر الأوامر. يستخدم الـ Plugin الأمرين `rec` و`play`
  للجسر الصوتي الافتراضي بتنسيق 8 كيلوهرتز G.711 mu-law.
- `blackhole-2ch`: برنامج تشغيل صوت افتراضي لـ macOS. ينشئ جهاز الصوت
  `BlackHole 2ch` الذي يمكن لـ Chrome/Meet التوجيه عبره.

لا يقوم OpenClaw بتضمين أي من الحزمتين أو إعادة توزيعهما. تطلب الوثائق من المستخدمين تثبيتهما كتبعيات مضيف عبر Homebrew. ترخيص SoX هو
`LGPL-2.0-only AND GPL-2.0-only`؛ أما BlackHole فترخيصه GPL-3.0. إذا كنت تبني مثبّتًا أو جهازًا مخصصًا يضمّن BlackHole مع OpenClaw، فراجع شروط ترخيص BlackHole الأصلية أو احصل على ترخيص منفصل من Existential Audio.

## وسائل النقل

### Chrome

تفتح وسيلة النقل Chrome عنوان Meet URL في Google Chrome وتنضم باستخدام ملف Chrome الشخصي المسجّل الدخول. على macOS، يتحقق الـ Plugin من وجود `BlackHole 2ch` قبل التشغيل. وإذا تم تكوين ذلك، فإنه يشغّل أيضًا أمر فحص سلامة الجسر الصوتي وأمر بدء التشغيل قبل فتح Chrome. استخدم `chrome` عندما يكون Chrome/الصوت موجودًا على مضيف Gateway؛ واستخدم `chrome-node` عندما يكون Chrome/الصوت موجودًا على Node مقترن مثل Parallels macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

وجّه صوت الميكروفون ومكبر الصوت في Chrome عبر الجسر الصوتي المحلي لـ OpenClaw. إذا لم يكن `BlackHole 2ch` مثبتًا، فسيفشل الانضمام بخطأ إعداد بدلًا من الانضمام بصمت من دون مسار صوتي.

### Twilio

وسيلة النقل Twilio هي خطة اتصال صارمة مفوّضة إلى Plugin مكالمات الصوت. وهي لا تحلّل صفحات Meet لاستخراج أرقام الهواتف.

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

## OAuth والفحص المسبق

يستخدم الوصول إلى Google Meet Media API عميل OAuth شخصيًا أولًا. قم بتكوين
`oauth.clientId` واختياريًا `oauth.clientSecret`، ثم شغّل:

```bash
openclaw googlemeet auth login --json
```

يطبع هذا الأمر كتلة تكوين `oauth` تحتوي على refresh token. وهو يستخدم PKCE،
واستدعاء localhost على `http://localhost:8085/oauth2callback`، وتدفق نسخ/لصق يدوي مع `--manual`.

تُقبل متغيرات البيئة التالية كبدائل:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` أو `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` أو `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` أو `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` أو `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` أو
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` أو `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` أو `GOOGLE_MEET_PREVIEW_ACK`

حلّ عنوان Meet URL أو رمز الاجتماع أو `spaces/{id}` عبر `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

شغّل الفحص المسبق قبل أعمال الوسائط:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

اضبط `preview.enrollmentAcknowledged: true` فقط بعد التأكد من أن مشروع Cloud الخاص بك، وهوية OAuth، والمشاركين في الاجتماع مسجّلون في Google Workspace Developer Preview Program لواجهات Meet media APIs.

## التكوين

لا يحتاج مسار Chrome الشائع في الوقت الفعلي إلا إلى تفعيل الـ Plugin وBlackHole وSoX ومفتاح موفّر صوت في الوقت الفعلي للواجهة الخلفية. OpenAI هو الافتراضي؛ اضبط
`realtime.provider: "google"` لاستخدام Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

اضبط تكوين الـ Plugin تحت `plugins.entries.google-meet.config`:

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

الإعدادات الافتراضية:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: معرّف/اسم/IP اختياري لـ Node من أجل `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: أمر SoX `rec` يكتب صوت 8 كيلوهرتز G.711 mu-law
  إلى stdout
- `chrome.audioOutputCommand`: أمر SoX `play` يقرأ صوت 8 كيلوهرتز G.711 mu-law
  من stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: ردود منطوقة موجزة، مع
  `openclaw_agent_consult` للإجابات الأعمق
- `realtime.introMessage`: فحص جاهزية منطوق قصير عند اتصال جسر الوقت الفعلي؛
  اضبطه على `""` للانضمام بصمت

تجاوزات اختيارية:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
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

تكوين خاص بـ Twilio فقط:

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
`transport: "chrome-node"` عندما يعمل Chrome على Node مقترن مثل Parallels
VM. في كلتا الحالتين، يعمل نموذج `realtime` و`openclaw_agent_consult` على مضيف Gateway، لذا تبقى بيانات اعتماد النموذج هناك.

استخدم `action: "status"` لسرد الجلسات النشطة أو فحص معرّف جلسة. واستخدم
`action: "speak"` مع `sessionId` و`message` لجعل وكيل الوقت الفعلي يتحدث فورًا. واستخدم `action: "leave"` لوضع علامة على انتهاء الجلسة.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## استشارة وكيل الوقت الفعلي

تم تحسين وضع Chrome `realtime` ليعمل ضمن حلقة صوتية مباشرة. يسمع موفّر الصوت في الوقت الفعلي صوت الاجتماع ويتحدث عبر الجسر الصوتي المُكوَّن. وعندما يحتاج نموذج الوقت الفعلي إلى استدلال أعمق أو معلومات حديثة أو أدوات OpenClaw العادية، يمكنه استدعاء `openclaw_agent_consult`.

تعمل أداة الاستشارة على تشغيل وكيل OpenClaw العادي في الخلفية باستخدام سياق حديث من نص الاجتماع، وتُرجع إجابة منطوقة موجزة إلى جلسة الصوت في الوقت الفعلي. ويمكن لنموذج الصوت بعد ذلك نطق هذه الإجابة داخل الاجتماع.

يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:

- `safe-read-only`: يعرض أداة الاستشارة ويقيّد الوكيل العادي بـ
  `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و
  `memory_get`.
- `owner`: يعرض أداة الاستشارة ويتيح للوكيل العادي استخدام سياسة أدوات الوكيل العادية.
- `none`: لا يعرض أداة الاستشارة لنموذج الصوت في الوقت الفعلي.

يكون مفتاح جلسة الاستشارة مقيّدًا لكل جلسة Meet، لذلك يمكن لاستدعاءات الاستشارة اللاحقة إعادة استخدام سياق الاستشارة السابق خلال الاجتماع نفسه.

لفرض فحص جاهزية منطوق بعد أن ينضم Chrome بالكامل إلى المكالمة:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## ملاحظات

إن واجهة media API الرسمية في Google Meet موجهة للاستقبال، لذلك لا يزال التحدث داخل مكالمة Meet يحتاج إلى مسار مشارك. يُبقي هذا الـ Plugin هذه الحدود واضحة:
يتولى Chrome المشاركة عبر المتصفح وتوجيه الصوت المحلي؛ ويتولى Twilio المشاركة عبر الاتصال الهاتفي.

يحتاج وضع Chrome `realtime` إلى أحد الخيارين التاليين:

- `chrome.audioInputCommand` بالإضافة إلى `chrome.audioOutputCommand`: يمتلك OpenClaw جسر نموذج الوقت الفعلي ويُمرّر صوت 8 كيلوهرتز G.711 mu-law بين هذين الأمرين وموفّر الصوت في الوقت الفعلي المحدد.
- `chrome.audioBridgeCommand`: يمتلك أمر جسر خارجي مسار الصوت المحلي بالكامل، ويجب أن يخرج بعد بدء خدمته الخلفية أو التحقق منها.

للحصول على صوت مزدوج نظيف، وجّه خرج Meet وميكروفون Meet عبر أجهزة افتراضية منفصلة أو مخطط أجهزة افتراضية على نمط Loopback. قد يتسبب جهاز BlackHole مشترك واحد في إعادة صدى المشاركين الآخرين إلى داخل المكالمة.

يؤدي `googlemeet speak` إلى تشغيل الجسر الصوتي النشط في الوقت الفعلي لجلسة Chrome.
ويؤدي `googlemeet leave` إلى إيقاف ذلك الجسر. وبالنسبة إلى جلسات Twilio المفوّضة عبر Plugin مكالمات الصوت، فإن `leave` ينهي أيضًا مكالمة الصوت الأساسية.

## ذو صلة

- [Plugin مكالمات الصوت](/ar/plugins/voice-call)
- [وضع التحدث](/ar/nodes/talk)
- [بناء Plugins](/ar/plugins/building-plugins)
