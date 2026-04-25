---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تقوم بتهيئة Plugin المكالمات الصوتية أو تطويره
summary: 'Plugin المكالمات الصوتية: مكالمات صادرة + واردة عبر Twilio/Telnyx/Plivo (تثبيت Plugin + التهيئة + CLI)'
title: Plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-04-25T13:55:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

مكالمات صوتية لـ OpenClaw عبر Plugin. يدعم الإشعارات الصادرة
والمحادثات متعددة الأدوار مع سياسات الوارد.

الموفرون الحاليون:

- `twilio` (`Programmable Voice + Media Streams`)
- `telnyx` (`Call Control v2`)
- `plivo` (`Voice API + XML transfer + GetInput speech`)
- `mock` (للتطوير/من دون شبكة)

النموذج الذهني السريع:

- ثبّت Plugin
- أعد تشغيل Gateway
- قم بالتهيئة تحت `plugins.entries.voice-call.config`
- استخدم `openclaw voicecall ...` أو أداة `voice_call`

## مكان التشغيل (محلي مقابل بعيد)

يعمل Plugin المكالمات الصوتية **داخل عملية Gateway**.

إذا كنت تستخدم Gateway بعيدًا، فقم بتثبيت Plugin وتهيئته على **الجهاز الذي يشغّل Gateway**، ثم أعد تشغيل Gateway لتحميله.

## التثبيت

### الخيار أ: التثبيت من npm (موصى به)

```bash
openclaw plugins install @openclaw/voice-call
```

أعد تشغيل Gateway بعد ذلك.

### الخيار ب: التثبيت من مجلد محلي (للتطوير، من دون نسخ)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

أعد تشغيل Gateway بعد ذلك.

## التهيئة

اضبط الإعداد تحت `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // أو "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // أو TWILIO_FROM_NUMBER لـ Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // المفتاح العام لـ Webhook الخاص بـ Telnyx من Telnyx Mission Control Portal
            // (سلسلة Base64؛ يمكن أيضًا ضبطه عبر TELNYX_PUBLIC_KEY).
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

          // التعريض العام (اختر واحدًا)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // اختياري؛ أول موفر نسخ آني مسجل عند عدم التعيين
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

          realtime: {
            enabled: false,
            provider: "google", // اختياري؛ أول موفر صوت آني مسجل عند عدم التعيين
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

تحقق من الإعداد قبل الاختبار مع موفر حقيقي:

```bash
openclaw voicecall setup
```

المخرجات الافتراضية قابلة للقراءة في سجلات الدردشة وجلسات الطرفية. فهي تتحقق
مما إذا كان Plugin مُمكّنًا، وما إذا كان الموفر وبيانات الاعتماد موجودة، وما إذا كان
تعريض Webhook مهيأ، وما إذا كان وضع صوت واحد فقط نشطًا. استخدم
`openclaw voicecall setup --json` للبرامج النصية.

بالنسبة إلى Twilio وTelnyx وPlivo، يجب أن يُحل الإعداد إلى عنوان URL عام لـ Webhook. إذا كان
`publicUrl` المهيأ، أو عنوان URL للنفق، أو عنوان URL لـ Tailscale، أو بديل serve يُحل إلى
local loopback أو مساحة شبكة خاصة، فسيفشل الإعداد بدلًا من بدء موفر
لا يمكنه استقبال Webhooks فعلية من شركة الاتصالات.

لاختبار دخاني من دون مفاجآت، شغّل:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

يبقى الأمر الثاني تشغيلًا تجريبيًا فقط. أضف `--yes` لإجراء مكالمة
إشعار صادرة قصيرة:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

ملاحظات:

- يتطلب Twilio/Telnyx عنوان URL لـ Webhook **يمكن الوصول إليه علنًا**.
- يتطلب Plivo عنوان URL لـ Webhook **يمكن الوصول إليه علنًا**.
- `mock` هو موفر تطوير محلي (من دون استدعاءات شبكة).
- إذا كانت الإعدادات الأقدم لا تزال تستخدم `provider: "log"` أو `twilio.from` أو مفاتيح OpenAI القديمة ضمن `streaming.*`، فشغّل `openclaw doctor --fix` لإعادة كتابتها.
- يتطلب Telnyx وجود `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` تساوي true.
- الخيار `skipSignatureVerification` مخصص للاختبار المحلي فقط.
- إذا كنت تستخدم المستوى المجاني من ngrok، فاضبط `publicUrl` على عنوان URL الدقيق لـ ngrok؛ إذ يُفرض التحقق من التوقيع دائمًا.
- يتيح `tunnel.allowNgrokFreeTierLoopbackBypass: true` استخدام Webhooks من Twilio مع تواقيع غير صالحة **فقط** عندما يكون `tunnel.provider="ngrok"` و`serve.bind` هو local loopback (الوكيل المحلي لـ ngrok). استخدمه للتطوير المحلي فقط.
- يمكن لعناوين URL الخاصة بالمستوى المجاني من Ngrok أن تتغير أو تضيف سلوك صفحات وسيطة؛ إذا تغيّر `publicUrl`، فستفشل تواقيع Twilio. في الإنتاج، فضّل نطاقًا ثابتًا أو Tailscale funnel.
- يؤدي `realtime.enabled` إلى بدء محادثات صوت إلى صوت كاملة؛ لا تقم بتمكينه مع `streaming.enabled` في الوقت نفسه.
- الإعدادات الافتراضية لأمان Streaming:
  - يقوم `streaming.preStartTimeoutMs` بإغلاق المقابس التي لا ترسل أبدًا إطار `start` صالحًا.
- يحد `streaming.maxPendingConnections` من إجمالي مقابس ما قبل البدء غير الموثقة.
- يحد `streaming.maxPendingConnectionsPerIp` من مقابس ما قبل البدء غير الموثقة لكل عنوان IP مصدر.
- يحد `streaming.maxConnections` من إجمالي مقابس تدفق الوسائط المفتوحة (المعلقة + النشطة).
- ما زال الرجوع وقت التشغيل يقبل مفاتيح voice-call القديمة هذه في الوقت الحالي، لكن مسار إعادة الكتابة هو `openclaw doctor --fix` وطبقة التوافق مؤقتة.

## محادثات صوتية آنية

يختار `realtime` موفر صوت آني ثنائي الاتجاه بالكامل لصوت المكالمة المباشر.
وهو منفصل عن `streaming`، الذي يمرر الصوت فقط إلى
موفري النسخ الآني.

سلوك وقت التشغيل الحالي:

- `realtime.enabled` مدعوم لـ Twilio Media Streams.
- لا يمكن دمج `realtime.enabled` مع `streaming.enabled`.
- `realtime.provider` اختياري. إذا لم يُعيّن، يستخدم Voice Call أول
  موفر صوت آني مسجل.
- تشمل موفرو الصوت الآني المضمنون Google Gemini Live (`google`) و
  OpenAI (`openai`)، ويتم تسجيلهم بواسطة Plugins الموفر الخاصة بهم.
- توجد الإعدادات الخام المملوكة للموفر تحت `realtime.providers.<providerId>`.
- يكشف Voice Call عن أداة الوقت الحقيقي المشتركة `openclaw_agent_consult` افتراضيًا. يمكن
  للنموذج الآني استدعاؤها عندما يطلب المتصل تفكيرًا أعمق أو معلومات
  حديثة أو أدوات OpenClaw العادية.
- يتحكم `realtime.toolPolicy` في تشغيل الاستشارة:
  - `safe-read-only`: يكشف أداة الاستشارة ويقيّد agent العادي إلى
    `read` و`web_search` و`web_fetch` و`x_search` و`memory_search` و
    `memory_get`.
  - `owner`: يكشف أداة الاستشارة ويتيح للـ agent العادي استخدام سياسة أدوات
    agent العادية.
  - `none`: لا يكشف أداة الاستشارة. وما تزال `realtime.tools` المخصصة
    تمر إلى الموفر الآني.
- تعيد مفاتيح جلسات الاستشارة استخدام جلسة الصوت الحالية عند توفرها، ثم
  تعود إلى رقم هاتف المتصل/المتلقى بحيث تحتفظ استدعاءات الاستشارة اللاحقة
  بالسياق أثناء المكالمة.
- إذا أشار `realtime.provider` إلى موفر غير مسجل، أو لم يكن هناك أي موفر
  صوت آني مسجل أساسًا، فسيسجل Voice Call تحذيرًا ويتخطى
  الوسائط الآنية بدلًا من فشل Plugin بالكامل.

الإعدادات الافتراضية للصوت الآني في Google Gemini Live:

- مفتاح API: `realtime.providers.google.apiKey` أو `GEMINI_API_KEY` أو
  `GOOGLE_GENERATIVE_AI_API_KEY`
- النموذج: `gemini-2.5-flash-native-audio-preview-12-2025`
- الصوت: `Kore`

مثال:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

استخدم OpenAI بدلًا من ذلك:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

راجع [موفر Google](/ar/providers/google) و[موفر OpenAI](/ar/providers/openai)
للاطلاع على الخيارات الخاصة بموفرات الصوت الآني.

## النسخ الآني

يختار `streaming` موفر نسخ آني لصوت المكالمة المباشر.

سلوك وقت التشغيل الحالي:

- `streaming.provider` اختياري. إذا لم يُعيّن، يستخدم Voice Call أول
  موفر نسخ آني مسجل.
- تشمل موفرو النسخ الآني المضمنون Deepgram (`deepgram`)،
  وElevenLabs (`elevenlabs`)، وMistral (`mistral`)، وOpenAI (`openai`)، وxAI
  (`xai`)، ويتم تسجيلهم بواسطة Plugins الموفر الخاصة بهم.
- توجد الإعدادات الخام المملوكة للموفر تحت `streaming.providers.<providerId>`.
- إذا أشار `streaming.provider` إلى موفر غير مسجل، أو لم يكن هناك أي موفر
  نسخ آني مسجل أساسًا، فسيسجل Voice Call تحذيرًا و
  يتخطى بث الوسائط بدلًا من فشل Plugin بالكامل.

الإعدادات الافتراضية لنسخ OpenAI الآني:

- مفتاح API: `streaming.providers.openai.apiKey` أو `OPENAI_API_KEY`
- النموذج: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

الإعدادات الافتراضية لنسخ xAI الآني:

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

ما زالت المفاتيح القديمة تُرحّل تلقائيًا بواسطة `openclaw doctor --fix`:

- `streaming.sttProvider` ← `streaming.provider`
- `streaming.openaiApiKey` ← `streaming.providers.openai.apiKey`
- `streaming.sttModel` ← `streaming.providers.openai.model`
- `streaming.silenceDurationMs` ← `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` ← `streaming.providers.openai.vadThreshold`

## منظف المكالمات الراكدة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى أبدًا Webhook نهائيًا
(على سبيل المثال، مكالمات وضع الإشعار التي لا تكتمل أبدًا). القيمة الافتراضية هي `0`
(معطّل).

النطاقات الموصى بها:

- **الإنتاج:** من `120` إلى `300` ثانية لتدفقات نمط الإشعار.
- أبقِ هذه القيمة **أعلى من `maxDurationSeconds`** حتى تتمكن المكالمات العادية من
  الاكتمال. نقطة بداية جيدة هي `maxDurationSeconds + 30–60` ثانية.

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

عندما يكون وكيل أو نفق أمام Gateway، يعيد Plugin بناء
عنوان URL العام للتحقق من التوقيع. تتحكم هذه الخيارات في رؤوس
إعادة التوجيه الموثوق بها.

يقوم `webhookSecurity.allowedHosts` بإدراج المضيفين المسموح بهم من رؤوس إعادة التوجيه.

يثق `webhookSecurity.trustForwardingHeaders` في رؤوس إعادة التوجيه دون قائمة سماح.

يثق `webhookSecurity.trustedProxyIPs` في رؤوس إعادة التوجيه فقط عندما يطابق
عنوان IP البعيد للطلب القائمة.

تكون حماية إعادة تشغيل Webhook مفعّلة لـ Twilio وPlivo. يتم الإقرار بطلبات
Webhook الصالحة المعاد تشغيلها ولكن يتم تخطي آثارها الجانبية.

تتضمن أدوار المحادثة في Twilio رمزًا مميزًا لكل دور في استدعاءات `<Gather>`، بحيث
لا يمكن لاستدعاءات الكلام الراكدة/المعاد تشغيلها تلبية دور نص مفرغ أحدث قيد الانتظار.

يتم رفض طلبات Webhook غير الموثقة قبل قراءة الجسم عندما تكون رؤوس
التوقيع المطلوبة من الموفّر مفقودة.

يستخدم Webhook الخاص بـ voice-call ملف تعريف جسم ما قبل المصادقة المشترك (64 كيلوبايت / 5 ثوانٍ)
بالإضافة إلى حد أقصى للطلبات قيد التنفيذ لكل IP قبل التحقق من التوقيع.

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

يستخدم Voice Call إعداد `messages.tts` الأساسي من أجل
بث الكلام في المكالمات. يمكنك تجاوزه تحت إعداد Plugin باستخدام
**البنية نفسها** — إذ يتم دمجه بعمق مع `messages.tts`.

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

- يتم إصلاح مفاتيح `tts.<provider>` القديمة داخل إعداد Plugin (`openai` و`elevenlabs` و`microsoft` و`edge`) بواسطة `openclaw doctor --fix`؛ يجب أن تستخدم الإعدادات المحفوظة `tts.providers.<provider>`.
- **يتم تجاهل Microsoft speech في المكالمات الصوتية** (يتطلب الصوت الهاتفي PCM؛ ولا يكشف ناقل Microsoft الحالي عن خرج PCM هاتفي).
- يُستخدم TTS الأساسي عند تمكين بث وسائط Twilio؛ بخلاف ذلك تعود المكالمات إلى الأصوات الأصلية للموفّر.
- إذا كان بث وسائط Twilio نشطًا بالفعل، فلن يعود Voice Call إلى استخدام TwiML `<Say>`. وإذا لم يكن TTS الهاتفي متاحًا في تلك الحالة، يفشل طلب التشغيل بدلًا من خلط مساري تشغيل.
- عندما يعود TTS الهاتفي إلى موفّر ثانوي، يسجل Voice Call تحذيرًا مع سلسلة الموفّر (`from` و`to` و`attempts`) لأغراض التصحيح.
- عندما يؤدي المقاطعة الكلامية في Twilio أو إنهاء البث إلى مسح طابور TTS المعلق، تتم تسوية
  طلبات التشغيل الموضوعة في الطابور بدلًا من تعليق المتصلين الذين ينتظرون اكتمال
  التشغيل.

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

تجاوز إلى ElevenLabs للمكالمات فقط (مع الإبقاء على الإعداد الأساسي في أماكن أخرى):

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

تكون سياسة الوارد افتراضيًا `disabled`. لتمكين المكالمات الواردة، اضبط:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

تمثل `inboundPolicy: "allowlist"` فحصًا منخفض الضمان لمعرّف المتصل. يقوم Plugin
بتطبيع القيمة `From` التي يوفّرها الموفّر ويقارنها مع `allowFrom`.
توثّق عملية التحقق من Webhook تسليم الموفّر وسلامة الحمولة، لكنها
لا تثبت ملكية رقم المتصل عبر PSTN/VoIP. تعامل مع `allowFrom` على أنه
ترشيح لمعرّف المتصل، وليس هوية قوية للمتصل.

تستخدم الاستجابات التلقائية نظام agent. اضبطه عبر:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### عقد المخرجات المنطوقة

بالنسبة إلى الاستجابات التلقائية، يضيف Voice Call عقد مخرجات منطوقة صارمًا إلى موجّه النظام:

- `{"spoken":"..."}`

ثم يستخرج Voice Call نص الكلام بشكل دفاعي:

- يتجاهل الحمولات المعلّمة كمحتوى reasoning/error.
- يحلل JSON المباشر، أو JSON داخل أسوار، أو مفاتيح `"spoken"` المضمنة.
- يعود إلى النص العادي ويزيل الفقرات الافتتاحية التي يُحتمل أن تكون تخطيطًا/وصفًا فوقيًا.

يحافظ هذا على تركيز التشغيل المنطوق على النص الموجّه للمتصل ويتجنب تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة إلى مكالمات `conversation` الصادرة، يرتبط التعامل مع الرسالة الأولى بحالة التشغيل المباشر:

- لا يتم تعطيل مسح طابور المقاطعة الكلامية والاستجابة التلقائية إلا أثناء النطق النشط للتحية الأولية.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتبقى الرسالة الأولية في الطابور لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال البث من دون تأخير إضافي.
- تؤدي المقاطعة الكلامية إلى إيقاف التشغيل النشط ومسح إدخالات
  TTS الخاصة بـ Twilio التي كانت في الطابور ولم تبدأ التشغيل بعد. وتُسوّى الإدخالات
  التي جرى مسحها على أنها متخطاة، بحيث يمكن لمنطق الاستجابة اللاحق
  المتابعة من دون انتظار صوت لن يتم تشغيله أبدًا.
- تستخدم المحادثات الصوتية الآنية الدور الافتتاحي الخاص ببث الوقت الحقيقي نفسه. لا ينشر Voice Call تحديث `<Say>` قديمًا عبر TwiML لتلك الرسالة الأولية، بحيث تبقى جلسات `<Connect><Stream>` الصادرة متصلة.

### مهلة سماح عند قطع بث Twilio

عندما ينقطع بث وسائط Twilio، ينتظر Voice Call مدة `2000ms` قبل إنهاء المكالمة تلقائيًا:

- إذا أعيد اتصال البث خلال تلك النافذة، يُلغى الإنهاء التلقائي.
- إذا لم يُسجَّل أي بث مجددًا بعد فترة السماح، تُنهى المكالمة لمنع تعليق المكالمات النشطة.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # اسم بديل لـ call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # يلخص كمون الدور من السجلات
openclaw voicecall expose --mode funnel
```

يقرأ `latency` ملف `calls.jsonl` من مسار التخزين الافتراضي لـ voice-call. استخدم
`--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لحصر التحليل
في آخر N من السجلات (الافتراضي 200). تتضمن المخرجات p50/p90/p99 لكمون
الدور وأوقات انتظار الاستماع.

## أداة agent

اسم الأداة: `voice_call`

الإجراءات:

- `initiate_call` (`message`, `to?`, `mode?`)
- `continue_call` (`callId`, `message`)
- `speak_to_user` (`callId`, `message`)
- `send_dtmf` (`callId`, `digits`)
- `end_call` (`callId`)
- `get_status` (`callId`)

يشحن هذا المستودع مستند skill مطابقًا في `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## ذو صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [وضع التحدث](/ar/nodes/talk)
- [التنبيه الصوتي](/ar/nodes/voicewake)
