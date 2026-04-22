---
read_when:
    - أنت تريد استخدام نماذج OpenAI في OpenClaw
    - أنت تريد مصادقة اشتراك Codex بدلًا من مفاتيح API
    - أنت بحاجة إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-22T04:28:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692615b77885c0387d339d47c02ff056ba95d3608aa681882893a46d2a0f723f
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

توفّر OpenAI واجهات API للمطورين لنماذج GPT. يدعم OpenClaw مساري مصادقة:

- **مفتاح API** — وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (نماذج `openai/*`)
- **اشتراك Codex** — تسجيل دخول ChatGPT/Codex مع وصول عبر الاشتراك (نماذج `openai-codex/*`)

تدعم OpenAI صراحةً استخدام OAuth الخاص بالاشتراك في الأدوات الخارجية وسير العمل مثل OpenClaw.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

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

    | Model ref | المسار | المصادقة |
    |-----------|-------|------|
    | `openai/gpt-5.4` | OpenAI Platform API المباشر | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | OpenAI Platform API المباشر | `OPENAI_API_KEY` |

    <Note>
    يتم توجيه تسجيل دخول ChatGPT/Codex عبر `openai-codex/*` وليس `openai/*`.
    </Note>

    ### مثال على config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    لا يعرّض OpenClaw النموذج `openai/gpt-5.3-codex-spark` على مسار API المباشر. ترفض طلبات OpenAI API الحية هذا النموذج. Spark خاص بـ Codex فقط.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex الخاص بك بدلًا من مفتاح API منفصل. يتطلب Codex cloud تسجيل الدخول إلى ChatGPT.

    <Steps>
      <Step title="شغّل Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرة:

        ```bash
        openclaw models auth login --provider openai-codex
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

    | Model ref | المسار | المصادقة |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | تسجيل دخول Codex |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | تسجيل دخول Codex (يعتمد على الاستحقاق) |

    <Note>
    هذا المسار منفصل عمدًا عن `openai/gpt-5.4`. استخدم `openai/*` مع مفتاح API للوصول المباشر إلى Platform، واستخدم `openai-codex/*` للوصول عبر اشتراك Codex.
    </Note>

    ### مثال على config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    إذا أعاد onboarding استخدام تسجيل دخول موجود لـ Codex CLI، فستبقى بيانات الاعتماد هذه مُدارة بواسطة Codex CLI. وعند انتهاء صلاحيتها، يعيد OpenClaw قراءة مصدر Codex الخارجي أولًا ثم يكتب بيانات الاعتماد المحدّثة مرة أخرى إلى تخزين Codex.
    </Tip>

    ### الحد الأقصى لنافذة السياق

    يتعامل OpenClaw مع بيانات وصف النموذج وحدّ سياق وقت التشغيل كقيمتين منفصلتين.

    بالنسبة إلى `openai-codex/gpt-5.4`:

    - `contextWindow` الأصلي: `1050000`
    - الحد الافتراضي لـ `contextTokens` في وقت التشغيل: `272000`

    يملك الحد الافتراضي الأصغر خصائص أفضل عمليًا من حيث زمن الاستجابة والجودة. يمكنك تجاوزه باستخدام `contextTokens`:

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
    استخدم `contextWindow` للتصريح ببيانات وصف النموذج الأصلية. واستخدم `contextTokens` لتقييد ميزانية سياق وقت التشغيل.
    </Note>

  </Tab>
</Tabs>

## توليد الصور

يسجّل Plugin ‏`openai` المضمّن توليد الصور عبر أداة `image_generate`.

| Capability                | القيمة |
| ------------------------- | ---------------------------------- |
| النموذج الافتراضي             | `openai/gpt-image-2`               |
| الحد الأقصى للصور لكل طلب    | 4                                  |
| وضع التعديل                 | مفعّل (حتى 5 صور مرجعية) |
| تجاوزات الحجم            | مدعومة، بما في ذلك أحجام 2K/4K   |
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
راجع [توليد الصور](/ar/tools/image-generation) للاطلاع على معاملات الأداة المشتركة، واختيار المزوّد، وسلوك failover.
</Note>

يُعد `gpt-image-2` الافتراضي لكل من توليد الصور من النص في OpenAI وتحرير الصور.
ولا يزال `gpt-image-1` قابلًا للاستخدام كتجاوز صريح للنموذج، لكن يجب أن تستخدم
تدفقات عمل الصور الجديدة في OpenAI النموذج `openai/gpt-image-2`.

توليد:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

تحرير:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## توليد الفيديو

يسجّل Plugin ‏`openai` المضمّن توليد الفيديو عبر أداة `video_generate`.

| Capability       | القيمة |
| ---------------- | --------------------------------------------------------------------------------- |
| النموذج الافتراضي    | `openai/sora-2`                                                                   |
| الأوضاع            | نص إلى فيديو، صورة إلى فيديو، تحرير فيديو واحد                                  |
| المدخلات المرجعية | صورة واحدة أو فيديو واحد                                                                |
| تجاوزات الحجم   | مدعومة                                                                         |
| تجاوزات أخرى  | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة |

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
راجع [توليد الفيديو](/ar/tools/video-generation) للاطلاع على معاملات الأداة المشتركة، واختيار المزوّد، وسلوك failover.
</Note>

## مساهمة GPT-5 في prompt

يضيف OpenClaw مساهمة prompt خاصة بـ OpenAI GPT-5 لتشغيلات عائلة GPT-5 ضمن `openai/*` و`openai-codex/*`. وهي موجودة داخل Plugin ‏OpenAI المضمّن، وتنطبق على معرّفات النماذج مثل `gpt-5` و`gpt-5.2` و`gpt-5.4` و`gpt-5.4-mini`، ولا تنطبق على نماذج GPT-4.x الأقدم.

تضيف مساهمة GPT-5 عقد سلوك موسومًا لاستمرارية الشخصية، وأمان التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوصات الإكمال، والتحقق. ويبقى سلوك الردود الخاص بكل قناة وسلوك الرسائل الصامتة ضمن system prompt المشترك في OpenClaw وسياسة التسليم الصادرة. ويكون توجيه GPT-5 مفعّلًا دائمًا للنماذج المطابقة. أما طبقة أسلوب التفاعل الودود فهي منفصلة وقابلة للضبط.

| القيمة                  | التأثير                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (الافتراضي) | تفعيل طبقة أسلوب التفاعل الودود |
| `"on"`                 | اسم بديل لـ `"friendly"`                      |
| `"off"`                | تعطيل طبقة الأسلوب الودود فقط       |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
تكون القيم غير حساسة لحالة الأحرف وقت التشغيل، لذا فإن `"Off"` و`"off"` كلتاهما تعطلان طبقة الأسلوب الودود.
</Tip>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="تركيب الكلام (TTS)">
    يسجّل Plugin ‏`openai` المضمّن تركيب الكلام لواجهة `messages.tts`.

    | الإعداد | مسار config | الافتراضي |
    |---------|------------|---------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يعود إلى `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    النماذج المتاحة: `gpt-4o-mini-tts` و`tts-1` و`tts-1-hd`. والأصوات المتاحة: `alloy` و`ash` و`ballad` و`cedar` و`coral` و`echo` و`fable` و`juniper` و`marin` و`onyx` و`nova` و`sage` و`shimmer` و`verse`.

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
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز TTS base URL من دون التأثير على نقطة نهاية chat API.
    </Note>

  </Accordion>

  <Accordion title="النسخ اللحظي">
    يسجّل Plugin ‏`openai` المضمّن النسخ اللحظي لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار config | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يعود إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law.
    </Note>

  </Accordion>

  <Accordion title="الصوت اللحظي">
    يسجّل Plugin ‏`openai` المضمّن الصوت اللحظي لـ Plugin المكالمات الصوتية.

    | الإعداد | مسار config | الافتراضي |
    |---------|------------|---------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | الصوت | `...openai.voice` | `alloy` |
    | الحرارة | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يعود إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفاتيح config ‏`azureEndpoint` و`azureDeployment`. ويدعم استدعاء الأدوات ثنائي الاتجاه. ويستخدم تنسيق الصوت G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw أسلوب WebSocket أولًا مع fallback إلى SSE ‏(`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر واحد قبل الرجوع إلى SSE
    - بعد الفشل، يعلّم WebSocket على أنه متدهور لمدة تقارب 60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق رؤوسًا مستقرة لهوية الجلسة والدور من أجل إعادة المحاولة وإعادة الاتصال
    - يطبّع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر متغيرات النقل

    | القيمة | السلوك |
    |-------|----------|
    | `"auto"` (الافتراضي) | WebSocket أولًا، ثم fallback إلى SSE |
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

    وثائق OpenAI ذات الصلة:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="إحماء WebSocket">
    يفعّل OpenClaw إحماء WebSocket افتراضيًا لـ `openai/*` لتقليل زمن استجابة الدور الأول.

    ```json5
    // Disable warm-up
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

  <Accordion title="الوضع السريع">
    يوفّر OpenClaw مفتاح تبديل مشتركًا للوضع السريع لكل من `openai/*` و`openai-codex/*`:

    - **الدردشة/واجهة المستخدم:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند التمكين، يربط OpenClaw الوضع السريع بمعالجة OpenAI ذات الأولوية (`service_tier = "priority"`). ويتم الاحتفاظ بقيم `service_tier` الموجودة، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

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
    تتغلب تجاوزات الجلسة على config. وتؤدي إزالة تجاوز الجلسة في واجهة Sessions إلى إعادة الجلسة إلى الإعداد الافتراضي المكوَّن.
    </Note>

  </Accordion>

  <Accordion title="المعالجة ذات الأولوية (service_tier)">
    تكشف API الخاصة بـ OpenAI المعالجة ذات الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

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

    القيم المدعومة: `auto` و`default` و`flex` و`priority`.

    <Warning>
    يتم تمرير `serviceTier` فقط إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). إذا وجّهت أيًا من المزوّدين عبر proxy، فسيترك OpenClaw القيمة `service_tier` دون تعديل.
    </Warning>

  </Accordion>

  <Accordion title="Compaction على جانب الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل OpenClaw تلقائيًا Compaction على جانب الخادم:

    - يفرض `store: true` (ما لم يضبط compat للنموذج القيمة `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - القيمة الافتراضية لـ `compact_threshold`: ‏70% من `contextWindow` (أو `80000` عند عدم توفرها)

    <Tabs>
      <Tab title="التمكين صراحةً">
        مفيد لنقاط النهاية المتوافقة مثل Azure OpenAI Responses:

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
    يتحكم `responsesServerCompaction` فقط في حقن `context_management`. ولا تزال نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم يضبط compat القيمة `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="وضع GPT الوكيلي الصارم">
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
    - لا يعود يعتبر دورًا قائمًا على الخطة فقط تقدمًا ناجحًا عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدور مع توجيه steer للتصرف الآن
    - يفعّل `update_plan` تلقائيًا للأعمال الكبيرة
    - يعرض حالة حظر صريحة إذا استمر النموذج في التخطيط من دون تنفيذ

    <Note>
    هذا النطاق محصور في تشغيلات OpenAI وCodex لعائلة GPT-5 فقط. أما المزوّدون الآخرون وعائلات النماذج الأقدم فيحتفظون بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط نهاية OpenAI وCodex وAzure OpenAI المباشرة بشكل مختلف عن proxies العامة المتوافقة مع OpenAI لمسار `/v1`:

    **المسارات الأصلية** (`openai/*` و`openai-codex/*` وAzure OpenAI):
    - تُبقي `reasoning: { effort: "none" }` فقط للنماذج التي تدعم قيمة OpenAI ‏`none`
    - تُسقط تعطيل reasoning للنماذج أو proxies التي ترفض `reasoning.effort: "none"`
    - تجعل مخططات الأدوات في الوضع الصارم افتراضيًا
    - تُرفق رؤوس attribution مخفية على المضيفات الأصلية المتحقق منها فقط
    - تُبقي تشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier` و`store` وreasoning-compat وتلميحات prompt-cache)

    **المسارات المتوافقة/عبر proxy:**
    - تستخدم سلوك compat أكثر مرونة
    - لا تفرض مخططات أدوات صارمة أو رؤوسًا أصلية فقط

    يستخدم Azure OpenAI النقل الأصلي وسلوك compat الأصلي لكنه لا يتلقى رؤوس attribution المخفية.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، وModel refs، وسلوك failover.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
