---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تضبط Plugin voice-call أو تطوره
summary: 'Plugin Voice Call: المكالمات الصادرة + الواردة عبر Twilio/Telnyx/Plivo (تثبيت Plugin + التكوين + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-23T07:30:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fbfe1aba459dd4fbe1b5c100430ff8cbe8987d7d34b875d115afcaee6e56412
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

المكالمات الصوتية لـ OpenClaw عبر Plugin. يدعم الإشعارات الصادرة
والمحادثات متعددة الأدوار مع سياسات للمكالمات الواردة.

موفرو الخدمة الحاليون:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (للتطوير/من دون شبكة)

نموذج ذهني سريع:

- ثبّت Plugin
- أعد تشغيل Gateway
- اضبط التكوين تحت `plugins.entries.voice-call.config`
- استخدم `openclaw voicecall ...` أو أداة `voice_call`

## مكان التشغيل (محلي أم بعيد)

يعمل Plugin Voice Call **داخل عملية Gateway**.

إذا كنت تستخدم Gateway بعيدًا، فثبّت Plugin واضبطه على **الجهاز الذي يشغّل Gateway**، ثم أعد تشغيل Gateway لتحميله.

## التثبيت

### الخيار A: التثبيت من npm (موصى به)

```bash
openclaw plugins install @openclaw/voice-call
```

أعد تشغيل Gateway بعد ذلك.

### الخيار B: التثبيت من مجلد محلي (للتطوير، من دون نسخ)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

أعد تشغيل Gateway بعد ذلك.

## التكوين

اضبط التكوين تحت `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // أو "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // المفتاح العام لـ webhook الخاص بـ Telnyx من Telnyx Mission Control Portal
            // (سلسلة Base64؛ ويمكن ضبطه أيضًا عبر TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // خادم Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // أمان Webhook (موصى به للأنفاق/الوكلاء)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // الإتاحة العامة (اختر واحدًا)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // اختياري؛ أول provider نسخ فوري مسجل عند عدم التحديد
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // اختياري إذا كان OPENAI_API_KEY مضبوطًا
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

ملاحظات:

- يتطلب Twilio/Telnyx عنوان webhook **يمكن الوصول إليه علنًا**.
- يتطلب Plivo عنوان webhook **يمكن الوصول إليه علنًا**.
- `mock` هو provider محلي للتطوير (من دون استدعاءات شبكة).
- إذا كانت التكوينات الأقدم لا تزال تستخدم `provider: "log"` أو `twilio.from` أو مفاتيح OpenAI القديمة في `streaming.*`، فشغّل `openclaw doctor --fix` لإعادة كتابتها.
- يتطلب Telnyx القيمة `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` تساوي true.
- إن `skipSignatureVerification` مخصص للاختبار المحلي فقط.
- إذا كنت تستخدم الطبقة المجانية من ngrok، فاضبط `publicUrl` على عنوان ngrok الدقيق؛ إذ يُفرض التحقق من التوقيع دائمًا.
- تسمح `tunnel.allowNgrokFreeTierLoopbackBypass: true` بـ webhooks الخاصة بـ Twilio ذات التوقيعات غير الصالحة **فقط** عندما تكون `tunnel.provider="ngrok"` و`serve.bind` هو loopback (وكيل ngrok المحلي). استخدم ذلك للتطوير المحلي فقط.
- قد تتغير عناوين الطبقة المجانية من Ngrok أو تضيف سلوكًا وسيطًا؛ وإذا انحرف `publicUrl` فستفشل توقيعات Twilio. وبالنسبة إلى الإنتاج، فضّل نطاقًا ثابتًا أو Tailscale funnel.
- القيم الافتراضية لأمان البث:
  - تقوم `streaming.preStartTimeoutMs` بإغلاق المقابس التي لا ترسل إطار `start` صالحًا.
- تحد `streaming.maxPendingConnections` من إجمالي مقابس ما قبل البدء غير الموثقة.
- تحد `streaming.maxPendingConnectionsPerIp` من مقابس ما قبل البدء غير الموثقة لكل عنوان IP مصدر.
- تحد `streaming.maxConnections` من إجمالي مقابس بث الوسائط المفتوحة (المعلقة + النشطة).
- ما يزال fallback في وقت التشغيل يقبل مفاتيح voice-call القديمة حاليًا، لكن مسار إعادة الكتابة هو `openclaw doctor --fix` وshim التوافق مؤقت.

## النسخ الفوري للبث

يختار `streaming` provider نسخ فوري للصوت المباشر في المكالمات.

السلوك الحالي في وقت التشغيل:

- القيمة `streaming.provider` اختيارية. وإذا لم تُحدد، يستخدم Voice Call أول
  provider نسخ فوري مسجل.
- تشمل موفري النسخ الفوري المضمّنين Deepgram (`deepgram`) و
  ElevenLabs (`elevenlabs`) وMistral (`mistral`) وOpenAI (`openai`) وxAI
  (`xai`)، وتُسجل بواسطة Plugins الخاصة بموفريها.
- يوجد التكوين الخام المملوك للـ provider تحت `streaming.providers.<providerId>`.
- إذا كانت `streaming.provider` تشير إلى provider غير مسجل، أو لم يكن أي
  provider نسخ فوري مسجلًا أصلًا، فسيسجل Voice Call تحذيرًا و
  يتخطى بث الوسائط بدلًا من إفساد Plugin بالكامل.

القيم الافتراضية لنسخ OpenAI الفوري:

- مفتاح API: `streaming.providers.openai.apiKey` أو `OPENAI_API_KEY`
- النموذج: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

القيم الافتراضية لنسخ xAI الفوري:

- مفتاح API: `streaming.providers.xai.apiKey` أو `XAI_API_KEY`
- نقطة النهاية: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

مثال:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // اختياري إذا كان OPENAI_API_KEY مضبوطًا
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

استخدم xAI بدلًا من ذلك:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // اختياري إذا كان XAI_API_KEY مضبوطًا
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

لا تزال المفاتيح القديمة تُرحَّل تلقائيًا بواسطة `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## منظف المكالمات الراكدة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى أبدًا webhook نهائيًا
(مثل مكالمات وضع notify التي لا تكتمل أبدًا). القيمة الافتراضية هي `0`
(معطّل).

النطاقات الموصى بها:

- **الإنتاج:** من `120` إلى `300` ثانية لتدفقات بأسلوب notify.
- اجعل هذه القيمة **أعلى من `maxDurationSeconds`** حتى تتمكن المكالمات العادية من
  الاكتمال. ونقطة بداية جيدة هي `maxDurationSeconds + 30–60` ثانية.

مثال:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## أمان Webhook

عندما يكون proxy أو نفق أمام Gateway، يعيد Plugin بناء
عنوان URL العام من أجل التحقق من التوقيع. وتتحكم هذه الخيارات في أي رؤوس
إعادة التوجيه موثوق بها.

تضيف `webhookSecurity.allowedHosts` المضيفين إلى قائمة السماح من رؤوس إعادة التوجيه.

تجعل `webhookSecurity.trustForwardingHeaders` رؤوس إعادة التوجيه موثوقًا بها من دون قائمة سماح.

تجعل `webhookSecurity.trustedProxyIPs` رؤوس إعادة التوجيه موثوقًا بها فقط عندما يطابق
عنوان IP البعيد للطلب القائمة.

تكون الحماية من إعادة تشغيل Webhook مفعلة لـ Twilio وPlivo. وتُؤكَّد طلبات webhook
الصالحة المعاد تشغيلها لكن تُتخطى آثارها الجانبية.

تتضمن أدوار محادثة Twilio رمزًا مميزًا لكل دور في نداءات `<Gather>` المرتدة، لذلك
لا يمكن لنداءات الكلام القديمة/المعاد تشغيلها أن تُلبّي دور نص مفرغ أحدث معلق.

تُرفض طلبات webhook غير الموثقة قبل قراءة الجسم عندما تكون
رؤوس التوقيع المطلوبة للـ provider مفقودة.

يستخدم webhook الخاص بـ voice-call ملف تعريف الجسم المشترك لما قبل المصادقة (64 KB / 5 ثوانٍ)
بالإضافة إلى حد قيد التنفيذ لكل IP قبل التحقق من التوقيع.

مثال مع مضيف عام ثابت:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS للمكالمات

يستخدم Voice Call التكوين الأساسي `messages.tts` من أجل
بث الكلام في المكالمات. ويمكنك تجاوزه تحت تكوين Plugin باستخدام
**الشكل نفسه** — إذ يُدمج دمجًا عميقًا مع `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

ملاحظات:

- تُرحَّل مفاتيح `tts.<provider>` القديمة داخل تكوين Plugin (`openai` و`elevenlabs` و`microsoft` و`edge`) تلقائيًا إلى `tts.providers.<provider>` عند التحميل. فضّل شكل `providers` في التكوين الملتزم.
- **يتم تجاهل Microsoft speech في المكالمات الصوتية** (صوت الاتصالات الهاتفية يحتاج إلى PCM؛ ووسيلة نقل Microsoft الحالية لا تكشف خرج PCM الخاص بالاتصالات).
- يُستخدم TTS الأساسي عندما يكون بث وسائط Twilio مفعّلًا؛ وإلا فترجع المكالمات إلى الأصوات الأصلية للـ provider.
- إذا كان بث وسائط Twilio نشطًا بالفعل، فلن يرجع Voice Call إلى TwiML `<Say>`. وإذا لم يكن TTS الهاتفي متاحًا في تلك الحالة، يفشل طلب التشغيل بدلًا من خلط مساري تشغيل.
- عندما يرجع TTS الهاتفي إلى provider ثانوي، يسجل Voice Call تحذيرًا مع سلسلة provider (`from` و`to` و`attempts`) من أجل تصحيح الأخطاء.

### مزيد من الأمثلة

استخدم TTS الأساسي فقط (من دون تجاوز):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

تجاوز إلى ElevenLabs للمكالمات فقط (واحتفظ بالقيمة الأساسية في أماكن أخرى):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

تجاوز نموذج OpenAI فقط للمكالمات (مثال على الدمج العميق):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## المكالمات الواردة

القيمة الافتراضية لسياسة الوارد هي `disabled`. ولتفعيل المكالمات الواردة، اضبط:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "مرحبًا! كيف يمكنني المساعدة؟",
}
```

إن `inboundPolicy: "allowlist"` هو فحص منخفض الضمان لمعرّف المتصل. يقوم Plugin
بتطبيع قيمة `From` التي يزوّدها provider ويقارنها مع `allowFrom`.
يوثق التحقق من Webhook تسليم provider وسلامة الحمولة، لكنه
لا يثبت ملكية رقم المتصل عبر PSTN/VoIP. تعامل مع `allowFrom` على أنه
ترشيح لمعرّف المتصل، وليس هوية قوية للمتصل.

تستخدم الردود التلقائية نظام الوكيل. ويمكن ضبطها باستخدام:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### عقد الخرج المنطوق

بالنسبة إلى الردود التلقائية، يضيف Voice Call عقدًا صارمًا للخرج المنطوق إلى system prompt:

- `{"spoken":"..."}`

ثم يستخرج Voice Call نص الكلام بشكل دفاعي:

- يتجاهل الحمولات المعلَّمة على أنها محتوى reasoning/error.
- يحلل JSON المباشر، أو JSON المحاط بأسوار، أو مفاتيح `"spoken"` المضمّنة.
- يعود إلى النص العادي ويزيل الفقرات الافتتاحية المرجحة للتخطيط/البيانات الوصفية.

هذا يُبقي التشغيل المنطوق مركزًا على النص الموجّه للمتصل ويمنع تسرّب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة إلى مكالمات `conversation` الصادرة، يرتبط التعامل مع الرسالة الأولى بحالة التشغيل الحي:

- لا يُقمع مسح قائمة انتظار المقاطعة والرد التلقائي إلا أثناء نطق التحية الأولية فعليًا.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتبقى الرسالة الأولية في قائمة الانتظار لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال البث من دون تأخير إضافي.

### مهلة السماح عند انقطاع بث Twilio

عند انقطاع بث وسائط Twilio، ينتظر Voice Call مدة `2000ms` قبل إنهاء المكالمة تلقائيًا:

- إذا أعاد البث الاتصال خلال تلك النافذة، يُلغى الإنهاء التلقائي.
- إذا لم يُسجل أي بث من جديد بعد انتهاء مهلة السماح، تُنهى المكالمة لمنع بقاء مكالمات نشطة عالقة.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # اسم مستعار لـ call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # لخّص زمن الاستجابة لكل دور من السجلات
openclaw voicecall expose --mode funnel
```

يقرأ `latency` الملف `calls.jsonl` من مسار التخزين الافتراضي لـ voice-call. استخدم
`--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لقصر التحليل
على آخر N سجلات (الافتراضي 200). ويتضمن الإخراج القيم p50/p90/p99 لزمن
الاستجابة لكل دور وأزمنة انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`

الإجراءات:

- `initiate_call` (`message`، `to?`، `mode?`)
- `continue_call` (`callId`، `message`)
- `speak_to_user` (`callId`، `message`)
- `end_call` (`callId`)
- `get_status` (`callId`)

يشحن هذا المستودع وثيقة Skill مطابقة في `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`، `message`، `mode?`)
- `voicecall.continue` (`callId`، `message`)
- `voicecall.speak` (`callId`، `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
