---
read_when:
    - تريد استخدام نماذج Grok في OpenClaw
    - أنت تضبط مصادقة xAI أو معرّفات النماذج
summary: استخدم نماذج xAI Grok في OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-23T07:32:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37a9fd184bab6f7ab363487332752141212a89c7380f6f91a659c78bcc470c9b
    source_path: providers/xai.md
    workflow: 15
---

# xAI

يشحن OpenClaw Plugin provider مضمّنًا باسم `xai` لنماذج Grok.

## البدء

<Steps>
  <Step title="أنشئ مفتاح API">
    أنشئ مفتاح API في [لوحة xAI](https://console.x.ai/).
  </Step>
  <Step title="اضبط مفتاح API الخاص بك">
    اضبط `XAI_API_KEY`، أو شغّل:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="اختر نموذجًا">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
يستخدم OpenClaw واجهة xAI Responses API كوسيلة النقل المضمّنة لـ xAI. ويمكن للمفتاح نفسه
`XAI_API_KEY` أيضًا تشغيل `web_search` المدعوم من Grok، و`x_search` من الدرجة الأولى،
و`code_execution` البعيد.
إذا خزّنت مفتاح xAI تحت `plugins.entries.xai.config.webSearch.apiKey`،
فإن مزود نموذج xAI المضمّن يعيد استخدام ذلك المفتاح كـ fallback أيضًا.
يوجد ضبط `code_execution` تحت `plugins.entries.xai.config.codeExecution`.
</Note>

## كتالوج النماذج المضمّن

يتضمن OpenClaw عائلات نماذج xAI التالية بشكل جاهز:

| العائلة         | معرّفات النماذج                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

كما يقوم Plugin أيضًا بحل معرّفات `grok-4*` و`grok-code-fast*` الأحدث مسبقًا عندما
تتبع شكل API نفسه.

<Tip>
تمثل `grok-4-fast` و`grok-4-1-fast` ومتغيرات `grok-4.20-beta-*`
مراجع Grok الحالية القادرة على الصور في الكتالوج المضمّن.
</Tip>

## تغطية ميزات OpenClaw

يربط Plugin المضمّن سطح API العام الحالي لـ xAI بعقود
provider والأدوات المشتركة في OpenClaw حيث يتناسب السلوك بشكل نظيف.

| قدرة xAI             | سطح OpenClaw                          | الحالة                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | مزود النماذج `xai/<model>`              | نعم                                                                 |
| البحث في الويب على جهة الخادم     | مزود `web_search` باسم `grok`              | نعم                                                                 |
| البحث في X على جهة الخادم       | أداة `x_search`                           | نعم                                                                 |
| تنفيذ الكود على جهة الخادم | أداة `code_execution`                     | نعم                                                                 |
| الصور                     | `image_generate`                          | نعم                                                                 |
| الفيديوهات                     | `video_generate`                          | نعم                                                                 |
| تحويل النص إلى كلام دفعي       | `messages.tts.provider: "xai"` / `tts`    | نعم                                                                 |
| TTS المتدفق              | —                                         | غير مكشوف؛ يعيد عقد TTS في OpenClaw مخازن صوت كاملة |
| تحويل الكلام إلى نص دفعي       | `tools.media.audio` / فهم الوسائط | نعم                                                                 |
| تحويل الكلام إلى نص متدفق   | Voice Call `streaming.provider: "xai"`    | نعم                                                                 |
| الصوت الفوري             | —                                         | غير مكشوف بعد؛ عقد جلسة/WebSocket مختلف               |
| الملفات / الدُفعات            | توافق Generic model API فقط      | ليست أداة من الدرجة الأولى في OpenClaw                                     |

<Note>
يستخدم OpenClaw واجهات xAI REST الخاصة بالصور/الفيديو/TTS/STT لتوليد الوسائط،
والكلام، والنسخ الدفعي، كما يستخدم WebSocket الخاص بـ xAI للبث STT
من أجل نسخ voice-call الحي، ويستخدم Responses API للنموذج والبحث
وأدوات تنفيذ الكود. أما الميزات التي تحتاج إلى عقود OpenClaw مختلفة، مثل
جلسات الصوت الفوري، فتُوثَّق هنا باعتبارها قدرات upstream بدلًا من أن تكون
سلوك Plugin مخفيًا.
</Note>

### ربط fast-mode

تؤدي `/fast on` أو `agents.defaults.models["xai/<model>"].params.fastMode: true`
إلى إعادة كتابة طلبات xAI الأصلية كما يلي:

| النموذج المصدر  | هدف fast-mode   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### الأسماء المستعارة القديمة للتوافق

لا تزال الأسماء المستعارة القديمة تُطبَّع إلى المعرّفات المضمّنة القانونية:

| الاسم المستعار القديم              | المعرّف القانوني                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## الميزات

<AccordionGroup>
  <Accordion title="البحث في الويب">
    يستخدم مزود البحث في الويب المضمّن `grok` القيمة `XAI_API_KEY` أيضًا:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="توليد الفيديو">
    يسجل Plugin `xai` المضمّن توليد الفيديو عبر الأداة المشتركة
    `video_generate`.

    - نموذج الفيديو الافتراضي: `xai/grok-imagine-video`
    - الأوضاع: نص إلى فيديو، وصورة إلى فيديو، وتحرير فيديو بعيد، وتمديد فيديو
      بعيد
    - نسب الأبعاد: `1:1` و`16:9` و`9:16` و`4:3` و`3:4` و`3:2` و`2:3`
    - الدقات: `480P` و`720P`
    - المدة: من 1 إلى 15 ثانية للتوليد/الصورة إلى فيديو، ومن 2 إلى 10 ثوانٍ
      للتمديد

    <Warning>
    لا تُقبل مخازن الفيديو المحلية. استخدم عناوين URL بعيدة من نوع `http(s)` من أجل
    مدخلات تحرير/تمديد الفيديو. أما الصورة إلى فيديو فتقبل مخازن الصور المحلية لأن
    OpenClaw يستطيع ترميزها كعناوين data URL لـ xAI.
    </Warning>

    لاستخدام xAI بوصفه مزود الفيديو الافتراضي:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    راجع [توليد الفيديو](/ar/tools/video-generation) للاطلاع على معلمات الأداة المشتركة،
    واختيار provider، وسلوك تجاوز الفشل.
    </Note>

  </Accordion>

  <Accordion title="توليد الصور">
    يسجّل Plugin `xai` المضمّن توليد الصور عبر الأداة المشتركة
    `image_generate`.

    - نموذج الصورة الافتراضي: `xai/grok-imagine-image`
    - نموذج إضافي: `xai/grok-imagine-image-pro`
    - الأوضاع: نص إلى صورة وتحرير صورة مرجعية
    - المدخلات المرجعية: `image` واحدة أو حتى خمس `images`
    - نسب الأبعاد: `1:1` و`16:9` و`9:16` و`4:3` و`3:4` و`2:3` و`3:2`
    - الدقات: `1K` و`2K`
    - العدد: حتى 4 صور

    يطلب OpenClaw من xAI استجابات صور من نوع `b64_json` حتى يمكن
    تخزين الوسائط المولدة وتسليمها عبر المسار العادي لمرفقات القنوات. وتُحوَّل
    الصور المرجعية المحلية إلى data URLs؛ أما المراجع البعيدة من نوع `http(s)` فتمرَّر كما هي.

    لاستخدام xAI بوصفه مزود الصور الافتراضي:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    توثّق xAI أيضًا الحقول `quality` و`mask` و`user` ونسبًا أصلية إضافية
    مثل `1:2` و`2:1` و`9:20` و`20:9`. يمرر OpenClaw فقط
    عناصر التحكم المشتركة بين موفري الصور اليوم؛ أما المفاتيح الأصلية فقط غير المدعومة
    فلا تُكشف عمدًا عبر `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="تحويل النص إلى كلام">
    يسجّل Plugin `xai` المضمّن تحويل النص إلى كلام عبر سطح provider
    المشترك `tts`.

    - الأصوات: `eve` و`ara` و`rex` و`sal` و`leo` و`una`
    - الصوت الافتراضي: `eve`
    - التنسيقات: `mp3` و`wav` و`pcm` و`mulaw` و`alaw`
    - اللغة: رمز BCP-47 أو `auto`
    - السرعة: تجاوز سرعة أصلي خاص بالـ provider
    - لا يُدعم تنسيق Opus الأصلي للملاحظات الصوتية

    لاستخدام xAI بوصفه مزود TTS الافتراضي:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    يستخدم OpenClaw نقطة النهاية الدُفعية `/v1/tts` الخاصة بـ xAI. كما توفر xAI أيضًا TTS متدفقًا
    عبر WebSocket، لكن عقد مزود الكلام في OpenClaw يتوقع حاليًا
    مخزنًا صوتيًا كاملًا قبل تسليم الرد.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجّل Plugin `xai` المضمّن تحويل الكلام إلى نص الدُفعي عبر سطح
    النسخ الخاص بفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `grok-stt`
    - نقطة النهاية: xAI REST `/v1/stt`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم في OpenClaw أينما استخدم نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قنوات Discord الصوتية و
      مرفقات الصوت في القنوات

    لفرض xAI لنسخ الصوت الوارد:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    يمكن توفير اللغة عبر التكوين المشترك لوسائط الصوت أو لكل طلب
    نسخ على حدة. وتُقبل تلميحات prompt عبر سطح OpenClaw المشترك،
    لكن تكامل xAI REST STT لا يمرر إلا الملف والنموذج و
    اللغة لأن هذه الحقول تطابق نقطة النهاية العامة الحالية لـ xAI بشكل نظيف.

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص المتدفق">
    يسجّل Plugin `xai` المضمّن أيضًا provider للنسخ الفوري
    لصوت Voice Call الحي.

    - نقطة النهاية: xAI WebSocket `wss://api.x.ai/v1/stt`
    - الترميز الافتراضي: `mulaw`
    - معدل العينة الافتراضي: `8000`
    - إنهاء النقطة الافتراضي: `800ms`
    - النصوص الوسيطة: مفعّلة افتراضيًا

    يرسل بث وسائط Twilio في Voice Call إطارات صوت G.711 µ-law، لذا يستطيع
    provider الخاص بـ xAI تمرير تلك الإطارات مباشرة من دون تحويل ترميز:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
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

    يوجد التكوين المملوك للـ provider تحت
    `plugins.entries.voice-call.config.streaming.providers.xai`. أما
    المفاتيح المدعومة فهي `apiKey` و`baseUrl` و`sampleRate` و`encoding` (`pcm` أو `mulaw` أو
    `alaw`) و`interimResults` و`endpointingMs` و`language`.

    <Note>
    هذا الـ provider المتدفق مخصص لمسار النسخ الفوري في Voice Call.
    أما الصوت في Discord فيسجل حاليًا مقاطع قصيرة ويستخدم مسار النسخ الدُفعي
    `tools.media.audio` بدلًا من ذلك.
    </Note>

  </Accordion>

  <Accordion title="تكوين x_search">
    يكشف Plugin xAI المضمّن `x_search` كأداة OpenClaw للبحث
    في محتوى X (المعروف سابقًا باسم Twitter) عبر Grok.

    مسار التكوين: `plugins.entries.xai.config.xSearch`

    | المفتاح                | النوع    | الافتراضي            | الوصف                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | تفعيل أو تعطيل `x_search`           |
    | `model`            | string  | `grok-4-1-fast`    | النموذج المستخدم لطلبات `x_search`     |
    | `inlineCitations`  | boolean | —                  | تضمين الاستشهادات المضمّنة في النتائج  |
    | `maxTurns`         | number  | —                  | الحد الأقصى لأدوار المحادثة           |
    | `timeoutSeconds`   | number  | —                  | مهلة الطلب بالثواني           |
    | `cacheTtlMinutes`  | number  | —                  | مدة صلاحية cache بالدقائق        |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="تكوين تنفيذ الكود">
    يكشف Plugin xAI المضمّن `code_execution` كأداة OpenClaw من أجل
    تنفيذ الكود عن بُعد في بيئة sandbox الخاصة بـ xAI.

    مسار التكوين: `plugins.entries.xai.config.codeExecution`

    | المفتاح               | النوع    | الافتراضي            | الوصف                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (إذا كان المفتاح متاحًا) | تفعيل أو تعطيل تنفيذ الكود  |
    | `model`           | string  | `grok-4-1-fast`    | النموذج المستخدم لطلبات تنفيذ الكود   |
    | `maxTurns`        | number  | —                  | الحد الأقصى لأدوار المحادثة               |
    | `timeoutSeconds`  | number  | —                  | مهلة الطلب بالثواني               |

    <Note>
    هذا تنفيذ sandbox بعيد من xAI، وليس [`exec`](/ar/tools/exec) محليًا.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="الحدود المعروفة">
    - المصادقة اليوم بمفتاح API فقط. ولا يوجد تدفق xAI OAuth أو device-code في
      OpenClaw حتى الآن.
    - النموذج `grok-4.20-multi-agent-experimental-beta-0304` غير مدعوم على
      مسار provider العادي لـ xAI لأنه يتطلب سطح API مختلفًا في upstream
      عن وسيلة نقل xAI القياسية في OpenClaw.
    - لم يُسجّل xAI Realtime voice بعد كمزود في OpenClaw. فهو
      يحتاج إلى عقد جلسة صوتية ثنائية الاتجاه يختلف عن STT الدُفعي أو
      النسخ المتدفق.
    - لا تُكشف القيم `quality` الخاصة بصور xAI، و`mask` الخاصة بالصور، ونسب الأبعاد الإضافية الأصلية فقط
      إلى أن تمتلك الأداة المشتركة `image_generate`
      عناصر تحكم مقابلة عابرة لموفري الخدمة.
  </Accordion>

  <Accordion title="ملاحظات متقدمة">
    - يطبق OpenClaw إصلاحات توافق خاصة بـ xAI على مخطط الأدوات واستدعاءات الأدوات
      تلقائيًا على مسار المشغّل المشترك.
    - تكون طلبات xAI الأصلية افتراضيًا على `tool_stream: true`. اضبط
      `agents.defaults.models["xai/<model>"].params.tool_stream` على `false` من أجل
      تعطيله.
    - يقوم الغلاف المضمّن لـ xAI بإزالة أعلام strict الخاصة بمخطط الأدوات غير المدعومة و
      مفاتيح حمولة reasoning قبل إرسال طلبات xAI الأصلية.
    - تُكشف `web_search` و`x_search` و`code_execution` كأدوات OpenClaw.
      ويفعّل OpenClaw المكوّن المضمّن المحدد من xAI الذي يحتاجه داخل كل طلب أداة
      بدلًا من إرفاق جميع الأدوات الأصلية بكل دور دردشة.
    - إن `x_search` و`code_execution` مملوكان لـ Plugin xAI المضمّن بدلًا
      من ترميزهما بشكل صلب في وقت تشغيل النموذج الأساسي.
    - إن `code_execution` هو تنفيذ sandbox بعيد من xAI، وليس
      [`exec`](/ar/tools/exec) محليًا.
  </Accordion>
</AccordionGroup>

## الاختبار الحي

تغطي اختبارات الوحدة مسارات وسائط xAI بالإضافة إلى أجنحة حية اختيارية. وتحمّل
الأوامر الحية الأسرار من shell تسجيل الدخول لديك، بما في ذلك `~/.profile`، قبل
فحص `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

يقوم الملف الحي الخاص بالـ provider بتوليف TTS عادي، وTTS بصيغة PCM
ملائم للاتصالات الهاتفية، ونسخ الصوت عبر xAI batch STT، وبث نفس PCM عبر xAI
realtime STT، وتوليد مخرجات نص إلى صورة، وتحرير صورة مرجعية. أما
ملف الصور الحي المشترك فيتحقق من provider xAI نفسه عبر
اختيار وقت التشغيل في OpenClaw، وfallback، والتطبيع، ومسار مرفقات الوسائط.

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار موفري الخدمة، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار provider.
  </Card>
  <Card title="جميع موفري الخدمة" href="/ar/providers/index" icon="grid-2">
    النظرة العامة الأوسع على موفري الخدمة.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة والحلول.
  </Card>
</CardGroup>
