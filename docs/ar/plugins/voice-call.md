---
read_when:
    - تريد إجراء مكالمة صوتية صادرة من OpenClaw
    - أنت تقوم بإعداد أو تطوير plugin voice-call
summary: 'Plugin مكالمات صوتية: مكالمات صادرة + واردة عبر Twilio/Telnyx/Plivo (تثبيت الـ plugin + الإعداد + CLI)'
title: plugin المكالمات الصوتية
x-i18n:
    generated_at: "2026-04-24T09:52:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aed4e33ce090c86f43c71280f033e446f335c53d42456fdc93c9938250e9af6
    source_path: plugins/voice-call.md
    workflow: 15
---

# المكالمات الصوتية (plugin)

مكالمات صوتية لـ OpenClaw عبر plugin. يدعم الإشعارات الصادرة
والمحادثات متعددة الأدوار مع سياسات واردة.

المزوّدون الحاليون:

- `twilio` (`Programmable Voice` + `Media Streams`)
- `telnyx` (`Call Control v2`)
- `plivo` (`Voice API` + نقل `XML` + كلام `GetInput`)
- `mock` (للتطوير/من دون شبكة)

النموذج الذهني السريع:

- ثبّت plugin
- أعد تشغيل Gateway
- قم بالإعداد ضمن `plugins.entries.voice-call.config`
- استخدم `openclaw voicecall ...` أو أداة `voice_call`

## مكان التشغيل (محلي أم بعيد)

يعمل plugin المكالمات الصوتية **داخل عملية Gateway**.

إذا كنت تستخدم Gateway بعيدًا، فقم بتثبيت/إعداد plugin على **الجهاز الذي يشغّل Gateway**، ثم أعد تشغيل Gateway لتحميله.

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

## الإعداد

اضبط الإعدادات ضمن `plugins.entries.voice-call.config`:

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
            // مفتاح Webhook العام لـ Telnyx من بوابة Telnyx Mission Control
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

          // الإتاحة العامة (اختر واحدًا)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // اختياري؛ أول مزوّد نسخ صوتي فوري مسجّل عند عدم التعيين
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
            provider: "google", // اختياري؛ أول مزوّد صوت فوري مسجّل عند عدم التعيين
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

ملاحظات:

- يتطلّب Twilio/Telnyx عنوان URL لـ Webhook **يمكن الوصول إليه علنًا**.
- يتطلّب Plivo عنوان URL لـ Webhook **يمكن الوصول إليه علنًا**.
- `mock` هو مزوّد تطوير محلي (من دون استدعاءات شبكة).
- إذا كانت الإعدادات الأقدم لا تزال تستخدم `provider: "log"` أو `twilio.from` أو مفاتيح OpenAI القديمة الخاصة بـ `streaming.*`، فشغّل `openclaw doctor --fix` لإعادة كتابتها.
- يتطلّب Telnyx القيمة `telnyx.publicKey` (أو `TELNYX_PUBLIC_KEY`) ما لم تكن `skipSignatureVerification` مفعّلة.
- الخيار `skipSignatureVerification` مخصّص للاختبار المحلي فقط.
- إذا كنت تستخدم المستوى المجاني من ngrok، فاضبط `publicUrl` على عنوان URL الخاص بـ ngrok بدقّة؛ إذ يتم دائمًا فرض التحقق من التوقيع.
- القيمة `tunnel.allowNgrokFreeTierLoopbackBypass: true` تسمح بـ Webhook من Twilio ذات التواقيع غير الصالحة **فقط** عندما تكون `tunnel.provider="ngrok"` و`serve.bind` هي loopback (وكيل ngrok المحلي). استخدم ذلك للتطوير المحلي فقط.
- قد تتغيّر عناوين URL الخاصة بالمستوى المجاني من Ngrok أو تضيف سلوك صفحات وسيطة؛ إذا انحرفت `publicUrl`، فسيفشل تحقق تواقيع Twilio. للإنتاج، يُفضّل استخدام نطاق ثابت أو Tailscale funnel.
- الخيار `realtime.enabled` يبدأ محادثات صوت إلى صوت كاملة؛ لا تفعّله مع `streaming.enabled` في الوقت نفسه.
- افتراضات أمان البث:
  - تقوم `streaming.preStartTimeoutMs` بإغلاق المقابس التي لا ترسل إطار `start` صالحًا أبدًا.
- تحدّ `streaming.maxPendingConnections` من إجمالي مقابس ما قبل البدء غير الموثّقة.
- تحدّ `streaming.maxPendingConnectionsPerIp` من مقابس ما قبل البدء غير الموثّقة لكل عنوان IP مصدر.
- تحدّ `streaming.maxConnections` من إجمالي مقابس تدفقات الوسائط المفتوحة (المعلّقة + النشطة).
- لا يزال التراجع وقت التشغيل يقبل مفاتيح voice-call القديمة هذه حاليًا، لكن مسار إعادة الكتابة هو `openclaw doctor --fix` وطبقة التوافق مؤقتة.

## محادثات الصوت الفورية

يختار `realtime` مزوّد صوت فوري ثنائي الاتجاه بالكامل لصوت المكالمة المباشر.
وهو منفصل عن `streaming`، الذي يمرّر الصوت فقط إلى
مزوّدي النسخ الصوتي الفوري.

سلوك وقت التشغيل الحالي:

- `realtime.enabled` مدعوم لتدفقات وسائط Twilio.
- لا يمكن الجمع بين `realtime.enabled` و`streaming.enabled`.
- الخيار `realtime.provider` اختياري. إذا لم يتم تعيينه، تستخدم Voice Call
  أول مزوّد صوت فوري مسجّل.
- تشمل مزوّدات الصوت الفوري المضمّنة Google Gemini Live (`google`) و
  OpenAI (`openai`)، ويتم تسجيلها بواسطة plugins المزودات الخاصة بها.
- يوجد الإعداد الخام المملوك للمزوّد ضمن `realtime.providers.<providerId>`.
- إذا كان `realtime.provider` يشير إلى مزوّد غير مسجّل، أو لم يكن هناك أي مزوّد
  صوت فوري مسجّل على الإطلاق، تسجّل Voice Call تحذيرًا وتتخطى
  الوسائط الفورية بدلًا من فشل plugin بالكامل.

افتراضات Google Gemini Live الفورية:

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
            instructions: "تحدث بإيجاز واسأل قبل استخدام الأدوات.",
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

راجع [مزود Google](/ar/providers/google) و[مزود OpenAI](/ar/providers/openai)
لخيارات الصوت الفوري الخاصة بكل مزوّد.

## النسخ الصوتي بالبث

يختار `streaming` مزوّد نسخ صوتي فوري لصوت المكالمة المباشر.

سلوك وقت التشغيل الحالي:

- الخيار `streaming.provider` اختياري. إذا لم يتم تعيينه، تستخدم Voice Call أول
  مزوّد نسخ صوتي فوري مسجّل.
- تشمل مزوّدات النسخ الصوتي الفوري المضمّنة Deepgram (`deepgram`) و
  ElevenLabs (`elevenlabs`) وMistral (`mistral`) وOpenAI (`openai`) وxAI
  (`xai`)، ويتم تسجيلها بواسطة plugins المزودات الخاصة بها.
- يوجد الإعداد الخام المملوك للمزوّد ضمن `streaming.providers.<providerId>`.
- إذا كان `streaming.provider` يشير إلى مزوّد غير مسجّل، أو لم يكن هناك أي مزوّد
  نسخ صوتي فوري مسجّل على الإطلاق، تسجّل Voice Call تحذيرًا و
  تتخطى بث الوسائط بدلًا من فشل plugin بالكامل.

افتراضات النسخ الصوتي بالبث لـ OpenAI:

- مفتاح API: `streaming.providers.openai.apiKey` أو `OPENAI_API_KEY`
- النموذج: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

افتراضات النسخ الصوتي بالبث لـ xAI:

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

لا تزال المفاتيح القديمة تُرحّل تلقائيًا بواسطة `openclaw doctor --fix`:

- `streaming.sttProvider` ← `streaming.provider`
- `streaming.openaiApiKey` ← `streaming.providers.openai.apiKey`
- `streaming.sttModel` ← `streaming.providers.openai.model`
- `streaming.silenceDurationMs` ← `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` ← `streaming.providers.openai.vadThreshold`

## منظف المكالمات القديمة

استخدم `staleCallReaperSeconds` لإنهاء المكالمات التي لا تتلقى أبدًا Webhook نهائيًا
(على سبيل المثال، مكالمات وضع الإشعار التي لا تكتمل أبدًا). القيمة الافتراضية هي `0`
(معطّل).

النطاقات الموصى بها:

- **الإنتاج:** `120`–`300` ثانية لتدفّقات بنمط الإشعار.
- أبقِ هذه القيمة **أعلى من `maxDurationSeconds`** حتى تتمكن المكالمات
  العادية من الاكتمال. نقطة بداية جيدة هي `maxDurationSeconds + 30–60` ثانية.

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

عندما يكون وكيل أو نفق أمام Gateway، يعيد plugin إنشاء
عنوان URL العام من أجل التحقق من التوقيع. تتحكم هذه الخيارات في رؤوس
التمرير التي يتم الوثوق بها.

يقوم `webhookSecurity.allowedHosts` بإدراج المضيفين المسموح بهم من رؤوس التمرير.

يقوم `webhookSecurity.trustForwardingHeaders` بالوثوق في رؤوس التمرير من دون قائمة سماح.

لا يقوم `webhookSecurity.trustedProxyIPs` بالوثوق في رؤوس التمرير إلا عندما يطابق
عنوان IP البعيد للطلب القائمة.

تكون حماية إعادة تشغيل Webhook مفعّلة لـ Twilio وPlivo. تتم
الاستجابة لطلبات Webhook المعاد تشغيلها والصحيحة ولكن يتم تجاهل آثارها الجانبية.

تتضمن أدوار محادثة Twilio رمزًا مميزًا لكل دور في استدعاءات `<Gather>`، لذلك
لا يمكن لاستدعاءات الكلام القديمة/المعاد تشغيلها تلبية دور نصي أحدث قيد الانتظار.

يتم رفض طلبات Webhook غير الموثّقة قبل قراءة الجسم عندما تكون رؤوس التوقيع
المطلوبة من المزوّد مفقودة.

يستخدم Webhook الخاص بـ voice-call ملف الجسم المشترك لما قبل المصادقة (64 كيلوبايت / 5 ثوانٍ)
بالإضافة إلى حدّ أقصى للطلبات الجارية لكل IP قبل التحقق من التوقيع.

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

## تحويل النص إلى كلام للمكالمات

تستخدم Voice Call إعداد `messages.tts` الأساسي من أجل
بث الكلام في المكالمات. يمكنك تجاوزه ضمن إعداد plugin باستخدام
**البنية نفسها** — حيث يتم دمجه دمجًا عميقًا مع `messages.tts`.

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

- تتم ترحيل مفاتيح `tts.<provider>` القديمة داخل إعداد plugin (`openai` و`elevenlabs` و`microsoft` و`edge`) تلقائيًا إلى `tts.providers.<provider>` عند التحميل. يُفضَّل استخدام بنية `providers` في الإعدادات المحفوظة.
- **يتم تجاهل Microsoft speech في المكالمات الصوتية** (صوت الاتصالات الهاتفية يحتاج إلى PCM؛ وطبقة النقل الحالية الخاصة بـ Microsoft لا توفّر خرج PCM للاتصالات الهاتفية).
- يُستخدم TTS الأساسي عندما يكون بث وسائط Twilio مفعّلًا؛ وإلا فستعود المكالمات إلى أصوات المزوّد الأصلية.
- إذا كان تدفق وسائط Twilio نشطًا بالفعل، فلن تعود Voice Call إلى `TwiML <Say>`. إذا لم يكن TTS الخاص بالاتصالات الهاتفية متاحًا في هذه الحالة، فسيفشل طلب التشغيل بدلًا من مزج مساري تشغيل.
- عندما يعود TTS الخاص بالاتصالات الهاتفية إلى مزوّد ثانوي، تسجّل Voice Call تحذيرًا بسلسلة المزوّد (`from` و`to` و`attempts`) لأغراض تصحيح الأخطاء.

### المزيد من الأمثلة

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

قم بالتجاوز إلى ElevenLabs للمكالمات فقط (مع إبقاء الإعداد الأساسي الافتراضي في أماكن أخرى):

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

قم بتجاوز نموذج OpenAI فقط للمكالمات (مثال على الدمج العميق):

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

تكون سياسة المكالمات الواردة افتراضيًا `disabled`. لتمكين المكالمات الواردة، اضبط:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "مرحبًا! كيف يمكنني المساعدة؟",
}
```

تمثل `inboundPolicy: "allowlist"` تصفية منخفضة الضمان بناءً على معرّف المتصل. يقوم plugin
بتطبيع قيمة `From` التي يوفّرها المزوّد ثم يقارنها مع `allowFrom`.
يؤدي التحقق من Webhook إلى توثيق تسليم المزوّد وسلامة الحمولة، لكنه
لا يثبت ملكية رقم المتصل على شبكات PSTN/VoIP. تعامل مع `allowFrom` على أنه
تصفية لمعرّف المتصل، وليس هوية قوية للمتصل.

تستخدم الردود التلقائية نظام الوكلاء. اضبطها باستخدام:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### عقد المخرجات المنطوقة

بالنسبة للردود التلقائية، تضيف Voice Call عقدًا صارمًا للمخرجات المنطوقة إلى prompt النظام:

- `{"spoken":"..."}`

ثم تستخرج Voice Call نص الكلام بشكل دفاعي:

- تتجاهل الحمولات المعلّمة على أنها محتوى استدلال/خطأ.
- تحلل JSON المباشر أو JSON داخل أسوار أو مفاتيح `"spoken"` المضمّنة.
- تعود إلى النص العادي وتزيل الفقرات الافتتاحية التي يُحتمل أن تكون تخطيطًا/بيانات وصفية.

هذا يحافظ على تركيز التشغيل الصوتي على النص الموجّه للمتصل ويتجنب تسريب نص التخطيط إلى الصوت.

### سلوك بدء المحادثة

بالنسبة لمكالمات `conversation` الصادرة، يرتبط التعامل مع الرسالة الأولى بحالة التشغيل المباشر:

- لا يتم مسح قائمة انتظار المقاطعة والرد التلقائي إلا أثناء نطق التحية الأولية فعليًا.
- إذا فشل التشغيل الأولي، تعود المكالمة إلى `listening` وتبقى الرسالة الأولية في قائمة الانتظار لإعادة المحاولة.
- يبدأ التشغيل الأولي لبث Twilio عند اتصال التدفق من دون تأخير إضافي.

### مهلة سماح انقطاع تدفق Twilio

عند انقطاع تدفق وسائط Twilio، تنتظر Voice Call مدة `2000ms` قبل إنهاء المكالمة تلقائيًا:

- إذا أُعيد اتصال التدفق خلال هذه النافذة، يُلغى الإنهاء التلقائي.
- إذا لم يُسجَّل أي تدفق مجددًا بعد فترة السماح، تُنهى المكالمة لمنع بقاء مكالمات نشطة معلّقة.

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
openclaw voicecall latency                     # يلخّص كمون الأدوار من السجلات
openclaw voicecall expose --mode funnel
```

تقوم `latency` بقراءة `calls.jsonl` من مسار التخزين الافتراضي لـ voice-call. استخدم
`--file <path>` للإشارة إلى سجل مختلف و`--last <n>` لقصر التحليل
على آخر N من السجلات (الافتراضي 200). يتضمن الناتج p50/p90/p99 لكمون
الأدوار وأزمنة انتظار الاستماع.

## أداة الوكيل

اسم الأداة: `voice_call`

الإجراءات:

- `initiate_call` (`message` و`to?` و`mode?`)
- `continue_call` (`callId` و`message`)
- `speak_to_user` (`callId` و`message`)
- `send_dtmf` (`callId` و`digits`)
- `end_call` (`callId`)
- `get_status` (`callId`)

يشحن هذا المستودع مستند Skills مطابقًا في `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?` و`message` و`mode?`)
- `voicecall.continue` (`callId` و`message`)
- `voicecall.speak` (`callId` و`message`)
- `voicecall.dtmf` (`callId` و`digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## ذي صلة

- [تحويل النص إلى كلام](/ar/tools/tts)
- [وضع التحدث](/ar/nodes/talk)
- [التنبيه الصوتي](/ar/nodes/voicewake)
