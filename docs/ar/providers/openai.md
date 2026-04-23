---
read_when:
    - أنت تريد استخدام نماذج OpenAI في OpenClaw
    - أنت تريد مصادقة اشتراك Codex بدلًا من مفاتيح API
    - أنت تحتاج إلى سلوك تنفيذ أكثر صرامة لوكلاء GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T07:31:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d847e53c2faee5363071dfdcb1f4150b64577674161e000844f579482198d1
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  توفر OpenAI واجهات API للمطورين لنماذج GPT. يدعم OpenClaw مساري مصادقة:

  - **مفتاح API** — وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (نماذج `openai/*`)
  - **اشتراك Codex** — تسجيل دخول ChatGPT/Codex مع وصول عبر الاشتراك (نماذج `openai-codex/*`)

  تدعم OpenAI صراحةً استخدام OAuth الخاص بالاشتراك في الأدوات وسير العمل الخارجية مثل OpenClaw.

  ## تغطية ميزات OpenClaw

  | قدرة OpenAI | سطح OpenClaw | الحالة |
  | ------------------------- | ----------------------------------------- | ------------------------------------------------------ |
  | الدردشة / Responses | موفر النماذج `openai/<model>` | نعم |
  | نماذج اشتراك Codex | موفر النماذج `openai-codex/<model>` | نعم |
  | البحث على الويب من جانب الخادم | أداة OpenAI Responses الأصلية | نعم، عند تفعيل البحث على الويب وعدم تثبيت موفر محدد |
  | الصور | `image_generate` | نعم |
  | الفيديو | `video_generate` | نعم |
  | تحويل النص إلى كلام | `messages.tts.provider: "openai"` / `tts` | نعم |
  | تحويل الكلام إلى نص على دفعات | `tools.media.audio` / فهم الوسائط | نعم |
  | تحويل الكلام إلى نص بشكل متدفق | Voice Call `streaming.provider: "openai"` | نعم |
  | الصوت الفوري | Voice Call `realtime.provider: "openai"` | نعم |
  | التضمينات | موفر تضمينات الذاكرة | نعم |

  ## البدء

  اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

  <Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل من أجل:** وصول API مباشر وفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ أو انسخ مفتاح API من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        أو مرّر المفتاح مباشرة:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | المسار | المصادقة |
    |-----------|-------|------|
    | `openai/gpt-5.4` | OpenAI Platform API مباشرة | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | OpenAI Platform API مباشرة | `OPENAI_API_KEY` |

    <Note>
    يتم توجيه تسجيل دخول ChatGPT/Codex عبر `openai-codex/*`، وليس `openai/*`.
    </Note>

    ### مثال على التكوين

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    لا يكشف OpenClaw **عن** `openai/gpt-5.3-codex-spark` على مسار API المباشر. إذ ترفض طلبات OpenAI API الحية هذا النموذج. إن Spark خاص بـ Codex فقط.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل من أجل:** استخدام اشتراك ChatGPT/Codex الخاص بك بدلًا من مفتاح API منفصل. يتطلب Codex السحابي تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل OAuth الخاص بـ Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرة:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        بالنسبة إلى الإعدادات الرأسية أو غير الملائمة لرد الاتصال، أضف `--device-code` لتسجيل الدخول باستخدام تدفق رمز الجهاز في ChatGPT بدلًا من رد الاتصال عبر المتصفح المحلي:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="اضبط النموذج الافتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | المسار | المصادقة |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | تسجيل دخول Codex |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | تسجيل دخول Codex (يعتمد على الاستحقاق) |

    <Note>
    هذا المسار منفصل عمدًا عن `openai/gpt-5.4`. استخدم `openai/*` مع مفتاح API للوصول المباشر إلى Platform، واستخدم `openai-codex/*` للوصول عبر اشتراك Codex.
    </Note>

    ### مثال على التكوين

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    لم يعد onboarding يستورد مواد OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth عبر المتصفح (الافتراضي) أو تدفق رمز الجهاز أعلاه — ويتولى OpenClaw إدارة بيانات الاعتماد الناتجة داخل مخزن مصادقة الوكيل الخاص به.
    </Note>

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات وصفية النموذج وحد بيئة التشغيل للسياق كقيمتين منفصلتين.

    بالنسبة إلى `openai-codex/gpt-5.4`:

    - `contextWindow` الأصلية: `1050000`
    - الحد الافتراضي لـ `contextTokens` في بيئة التشغيل: `272000`

    يتمتع الحد الافتراضي الأصغر بزمن استجابة أفضل وخصائص جودة أفضل عمليًا. يمكنك تجاوزه باستخدام `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    استخدم `contextWindow` للتصريح ببيانات النموذج الأصلية الوصفية. واستخدم `contextTokens` لتقييد ميزانية سياق بيئة التشغيل.
    </Note>

  </Tab>
</Tabs>

## توليد الصور

يسجل Plugin `openai` المضمّن توليد الصور عبر الأداة `image_generate`.

| القدرة | القيمة |
| ------------------------- | ---------------------------------- |
| النموذج الافتراضي | `openai/gpt-image-2` |
| الحد الأقصى للصور في كل طلب | 4 |
| وضع التعديل | مفعّل (حتى 5 صور مرجعية) |
| تجاوزات الحجم | مدعومة، بما في ذلك أحجام 2K/4K |
| نسبة الأبعاد / الدقة | لا يتم تمريرها إلى OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
راجع [Image Generation](/ar/tools/image-generation) للاطلاع على معلمات الأداة المشتركة، واختيار الموفّر، وسلوك failover.
</Note>

إن `gpt-image-2` هو الافتراضي لكل من توليد الصور من النص في OpenAI وتحرير الصور.
ولا يزال `gpt-image-1` قابلًا للاستخدام كتجاوز صريح للنموذج، لكن
مسارات عمل الصور الجديدة في OpenAI ينبغي أن تستخدم `openai/gpt-image-2`.

توليد:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

تعديل:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## توليد الفيديو

يسجل Plugin `openai` المضمّن توليد الفيديو عبر الأداة `video_generate`.

| القدرة | القيمة |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2` |
| الأوضاع | نص إلى فيديو، صورة إلى فيديو، تحرير فيديو واحد |
| المدخلات المرجعية | صورة واحدة أو فيديو واحد |
| تجاوزات الحجم | مدعومة |
| تجاوزات أخرى | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
راجع [Video Generation](/ar/tools/video-generation) للاطلاع على معلمات الأداة المشتركة، واختيار الموفّر، وسلوك failover.
</Note>

## مساهمة prompt الخاصة بـ GPT-5

يضيف OpenClaw مساهمة prompt مشتركة خاصة بـ GPT-5 لتشغيلات عائلة GPT-5 عبر الموفّرين. وهي تُطبّق حسب معرّف النموذج، لذا تتلقى `openai/gpt-5.4` و`openai-codex/gpt-5.4` و`openrouter/openai/gpt-5.4` و`opencode/gpt-5.4` وغيرها من مراجع GPT-5 المتوافقة التراكب نفسه. أما النماذج الأقدم GPT-4.x فلا تتلقى ذلك.

يستخدم موفّر Codex harness الأصلي المضمّن (`codex/*`) سلوك GPT-5 نفسه وتراكب Heartbeat عبر تعليمات المطور في Codex app-server، لذلك تحافظ جلسات `codex/gpt-5.x` على المتابعة نفسها وإرشادات Heartbeat الاستباقية نفسها رغم أن Codex يملك بقية prompt الخاصة بالـ harness.

تضيف مساهمة GPT-5 عقد سلوك موسومًا يتعلق باستمرارية الشخصية، وسلامة التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوصات الإكمال، والتحقق. أما سلوك الرد الخاص بالقناة وسلوك الرسائل الصامتة فيبقيان في system prompt المشترك لـ OpenClaw وسياسة التسليم الصادرة. تكون إرشادات GPT-5 مفعّلة دائمًا للنماذج المطابقة. أما طبقة أسلوب التفاعل الودّي فهي منفصلة وقابلة للتكوين.

| القيمة | التأثير |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (الافتراضي) | تفعيل طبقة أسلوب التفاعل الودّي |
| `"on"` | اسم مستعار لـ `"friendly"` |
| `"off"` | تعطيل طبقة الأسلوب الودّي فقط |

<Tabs>
  <Tab title="التكوين">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
تكون القيم غير حساسة لحالة الأحرف وقت التشغيل، لذا فإن `"Off"` و`"off"` كلتاهما تعطلان طبقة الأسلوب الودّي.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم مقروءًا كرجوع احتياطي للتوافق عندما لا يكون الإعداد المشترك `agents.defaults.promptOverlays.gpt5.personality` مضبوطًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="توليف الكلام (TTS)">
    يسجل Plugin `openai` المضمّن توليف الكلام لسطح `messages.tts`.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، لـ `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يرجع إلى `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    النماذج المتاحة: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. الأصوات المتاحة: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز عنوان TTS الأساسي من دون التأثير في نقطة نهاية Chat API.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجل Plugin `openai` المضمّن تحويل الكلام إلى نص على دفعات عبر
    سطح التحويل إلى نص لفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST ‏`/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي بنموذج multipart
    - مدعوم في OpenClaw أينما كان تحويل الصوت الوارد إلى نص يستخدم
      `tools.media.audio`، بما في ذلك مقاطع قنوات Discord الصوتية ومرفقات
      الصوت في القنوات

    لفرض استخدام OpenAI لتحويل الصوت الوارد إلى نص:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    تُمرر تلميحات اللغة وprompt إلى OpenAI عندما يوفّرها
    تكوين وسائط الصوت المشترك أو طلب التحويل إلى نص لكل استدعاء.

  </Accordion>

  <Accordion title="التحويل الفوري إلى نص">
    يسجل Plugin `openai` المضمّن التحويل الفوري إلى نص من أجل Plugin الخاص بـ Voice Call.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير مضبوط) |
    | Prompt | `...openai.prompt` | (غير مضبوط) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يرجع إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law ‏(`g711_ulaw` / `audio/pcmu`). موفر البث هذا مخصص لمسار التحويل الفوري إلى نص في Voice Call؛ أما صوت Discord فيسجل حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار التحويل على دفعات `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="الصوت الفوري">
    يسجل Plugin `openai` المضمّن الصوت الفوري من أجل Plugin الخاص بـ Voice Call.

    | الإعداد | مسار التكوين | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | الصوت | `...openai.voice` | `alloy` |
    | درجة الحرارة | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يرجع إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفاتيح التكوين `azureEndpoint` و`azureDeployment`. ويدعم الاستدعاء ثنائي الاتجاه للأدوات. ويستخدم تنسيق الصوت G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw أسلوب WebSocket أولًا مع رجوع SSE الاحتياطي (`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل مبكر واحد في WebSocket قبل الرجوع إلى SSE
    - بعد أي فشل، يعلّم WebSocket على أنه متدهور لمدة ~60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق رؤوس هوية جلسة ودور ثابتة لإعادة المحاولات وإعادة الاتصال
    - يطبّع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر أشكال النقل المختلفة

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (الافتراضي) | WebSocket أولًا، مع رجوع SSE الاحتياطي |
    | `"sse"` | فرض SSE فقط |
    | `"websocket"` | فرض WebSocket فقط |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    مستندات OpenAI ذات الصلة:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="إحماء WebSocket">
    يفعّل OpenClaw إحماء WebSocket افتراضيًا لـ `openai/*` لتقليل زمن الاستجابة في الدور الأول.

    ```json5
    // تعطيل الإحماء
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

<a id="openai-fast-mode"></a>

  <Accordion title="الوضع السريع">
    يكشف OpenClaw عن مفتاح وضع سريع مشترك لكل من `openai/*` و`openai-codex/*`:

    - **الدردشة/واجهة المستخدم:** `/fast status|on|off`
    - **التكوين:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند التفعيل، يربط OpenClaw الوضع السريع بالمعالجة ذات الأولوية في OpenAI ‏(`service_tier = "priority"`). وتُحفَظ قيم `service_tier` الحالية، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    تتغلب تجاوزات الجلسة على التكوين. ويؤدي مسح تجاوز الجلسة في واجهة Sessions إلى إعادة الجلسة إلى القيمة الافتراضية المضبوطة.
    </Note>

  </Accordion>

  <Accordion title="المعالجة ذات الأولوية (service_tier)">
    تكشف API الخاصة بـ OpenAI عن المعالجة ذات الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    القيم المدعومة: `auto`, `default`, `flex`, `priority`.

    <Warning>
    لا يُمرَّر `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). وإذا قمت بتوجيه أي موفر منهما عبر proxy، فإن OpenClaw يترك `service_tier` من دون تعديل.
    </Warning>

  </Accordion>

  <Accordion title="Compaction على جانب الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل OpenClaw تلقائيًا Compaction على جانب الخادم:

    - يفرض `store: true` (ما لم يضبط توافق النموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - القيمة الافتراضية لـ `compact_threshold`: ‏70% من `contextWindow` (أو `80000` عند عدم توفرها)

    <Tabs>
      <Tab title="تفعيل صريح">
        يكون هذا مفيدًا لنقاط النهاية المتوافقة مثل Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="عتبة مخصصة">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="تعطيل">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    يتحكم `responsesServerCompaction` فقط في حقن `context_management`. أما نماذج OpenAI Responses المباشرة فلا تزال تفرض `store: true` ما لم يضبط التوافق `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="وضع GPT الصارم الخاص بالوكلاء">
    بالنسبة إلى تشغيلات عائلة GPT-5 على `openai/*` و`openai-codex/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمّن أكثر صرامة:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    مع `strict-agentic`، يقوم OpenClaw بما يلي:
    - لم يعد يعامل الدور الذي يحتوي على خطة فقط على أنه تقدم ناجح عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدور مع توجيه "نفّذ الآن"
    - يفعّل تلقائيًا `update_plan` للأعمال الكبيرة
    - يعرض حالة حظر صريحة إذا استمر النموذج في التخطيط من دون تنفيذ

    <Note>
    هذا النطاق يقتصر على تشغيلات عائلة GPT-5 الخاصة بـ OpenAI وCodex فقط. أما الموفّرون الآخرون والعائلات الأقدم من النماذج فيحتفظون بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط النهاية المباشرة لـ OpenAI وCodex وAzure OpenAI بصورة مختلفة عن proxies العامة المتوافقة مع OpenAI على `/v1`:

    **المسارات الأصلية** (`openai/*` و`openai-codex/*` وAzure OpenAI):
    - تحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم قيمة OpenAI `none`
    - تحذف reasoning المعطل للنماذج أو proxies التي ترفض `reasoning.effort: "none"`
    - تجعل مخططات الأدوات في الوضع الصارم افتراضيًا
    - ترفق رؤوس attribution مخفية على المضيفين الأصليين المتحقق منهم فقط
    - تحتفظ بشكل الطلبات الخاص بـ OpenAI فقط (`service_tier`, `store`, وتوافق reasoning، وتلميحات prompt-cache)

    **المسارات المتوافقة/عبر proxy:**
    - تستخدم سلوك توافق أكثر تساهلًا
    - لا تفرض مخططات أدوات صارمة أو رؤوسًا أصلية فقط

    يستخدم Azure OpenAI النقل الأصلي وسلوك التوافق الأصلي، لكنه لا يتلقى رؤوس attribution المخفية.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار الموفّر.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
