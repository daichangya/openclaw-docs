---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلًا من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-21T07:26:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 172beb28b099e3d71998458408c9a6b32b03790d2b016351f724bc3f0d9d3245
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

توفر OpenAI واجهات API للمطورين لنماذج GPT. ويدعم OpenClaw مساري مصادقة:

- **مفتاح API** — وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (`openai/*` models)
- **اشتراك Codex** — تسجيل دخول ChatGPT/Codex مع وصول قائم على الاشتراك (`openai-codex/*` models)

تدعم OpenAI صراحةً استخدام OAuth القائم على الاشتراك في الأدوات وسير العمل الخارجية مثل OpenClaw.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API (OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ مفتاح API أو انسخه من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
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

    ### مثال على الإعدادات

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    لا يعرّض OpenClaw **لا** `openai/gpt-5.3-codex-spark` على مسار API المباشر. ترفض طلبات OpenAI API الحية هذا النموذج. Spark خاص بـ Codex فقط.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex بدلًا من مفتاح API منفصل. يتطلب Codex cloud تسجيل الدخول إلى ChatGPT.

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

    | مرجع النموذج | المسار | المصادقة |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | تسجيل دخول Codex |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | تسجيل دخول Codex (بحسب الاستحقاق) |

    <Note>
    هذا المسار منفصل عمدًا عن `openai/gpt-5.4`. استخدم `openai/*` مع مفتاح API للوصول المباشر إلى Platform، واستخدم `openai-codex/*` للوصول عبر اشتراك Codex.
    </Note>

    ### مثال على الإعدادات

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    إذا أعاد الإعداد الأولي استخدام تسجيل دخول موجود لـ Codex CLI، فستظل بيانات الاعتماد هذه مُدارة بواسطة Codex CLI. وعند انتهاء الصلاحية، يعيد OpenClaw أولًا قراءة مصدر Codex الخارجي ثم يكتب بيانات الاعتماد المحدّثة مرة أخرى إلى تخزين Codex.
    </Tip>

    ### الحد الأقصى لنافذة السياق

    يتعامل OpenClaw مع البيانات الوصفية للنموذج وحد السياق وقت التشغيل كقيمتين منفصلتين.

    بالنسبة إلى `openai-codex/gpt-5.4`:

    - `contextWindow` الأصلي: `1050000`
    - الحد الافتراضي لـ `contextTokens` وقت التشغيل: `272000`

    يتمتع الحد الافتراضي الأصغر بخصائص أفضل عمليًا من حيث الكمون والجودة. ويمكنك تجاوزه باستخدام `contextTokens`:

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
    استخدم `contextWindow` لتعريف البيانات الوصفية الأصلية للنموذج. واستخدم `contextTokens` لتقييد ميزانية السياق وقت التشغيل.
    </Note>

  </Tab>
</Tabs>

## إنشاء الصور

يسجل Plugin ‏`openai` المضمن إنشاء الصور عبر أداة `image_generate`.

| الإمكانية                | القيمة                               |
| ------------------------ | ------------------------------------ |
| النموذج الافتراضي        | `openai/gpt-image-1`                 |
| الحد الأقصى للصور لكل طلب | 4                                    |
| وضع التحرير              | مفعّل (حتى 5 صور مرجعية)             |
| تجاوزات الحجم            | مدعومة                               |
| نسبة الأبعاد / الدقة     | لا يتم تمريرها إلى OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-1" },
    },
  },
}
```

<Note>
راجع [إنشاء الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار الموفّر، وسلوك failover.
</Note>

## إنشاء الفيديو

يسجل Plugin ‏`openai` المضمن إنشاء الفيديو عبر أداة `video_generate`.

| الإمكانية        | القيمة                                                                              |
| ---------------- | ----------------------------------------------------------------------------------- |
| النموذج الافتراضي | `openai/sora-2`                                                                     |
| الأوضاع          | تحويل النص إلى فيديو، وتحويل الصورة إلى فيديو، وتحرير فيديو واحد                   |
| المدخلات المرجعية | صورة واحدة أو فيديو واحد                                                            |
| تجاوزات الحجم    | مدعومة                                                                              |
| تجاوزات أخرى     | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة       |

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
راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار الموفّر، وسلوك failover.
</Note>

## إسهام مطالبة GPT-5

يضيف OpenClaw إسهام مطالبة خاصًا بـ OpenAI لنماذج GPT-5 في تشغيلات `openai/*` و`openai-codex/*` الخاصة بعائلة GPT-5. وهو موجود داخل Plugin ‏OpenAI المضمن، وينطبق على معرّفات النماذج مثل `gpt-5` و`gpt-5.2` و`gpt-5.4` و`gpt-5.4-mini`، ولا ينطبق على نماذج GPT-4.x الأقدم.

يضيف إسهام GPT-5 عقد سلوك موسومًا لاستمرارية الشخصية، وسلامة التنفيذ، والانضباط في استخدام الأدوات، وشكل المخرجات، وفحوصات الاكتمال، والتحقق. ويظل سلوك الردود الخاصة بالقنوات وسلوك الرسائل الصامتة داخل مطالبة نظام OpenClaw المشتركة وسياسة التسليم الصادرة. وتظل إرشادات GPT-5 مفعلة دائمًا للنماذج المطابقة. أما طبقة أسلوب التفاعل الودية فهي منفصلة وقابلة للتهيئة.

| القيمة                 | التأثير                                      |
| ---------------------- | -------------------------------------------- |
| `"friendly"` (الافتراضي) | تفعيل طبقة أسلوب التفاعل الودية              |
| `"on"`                 | اسم مستعار لـ `"friendly"`                   |
| `"off"`                | تعطيل طبقة الأسلوب الودية فقط                |

<Tabs>
  <Tab title="الإعدادات">
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
القيم غير حساسة لحالة الأحرف في وقت التشغيل، لذا فإن `"Off"` و`"off"` كلاهما يعطّلان طبقة الأسلوب الودية.
</Tip>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="تخليق الكلام (TTS)">
    يسجل Plugin ‏`openai` المضمن تخليق الكلام لسطح `messages.tts`.

    | الإعداد | مسار الإعدادات | الافتراضي |
    |---------|----------------|-----------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يرجع إلى `OPENAI_API_KEY` |
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
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز عنوان TTS الأساسي من دون التأثير على نقطة نهاية Chat API.
    </Note>

  </Accordion>

  <Accordion title="النسخ الفوري">
    يسجل Plugin ‏`openai` المضمن النسخ الفوري لـ Plugin ‏Voice Call.

    | الإعداد | مسار الإعدادات | الافتراضي |
    |---------|----------------|-----------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يرجع إلى `OPENAI_API_KEY` |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law.
    </Note>

  </Accordion>

  <Accordion title="الصوت الفوري">
    يسجل Plugin ‏`openai` المضمن الصوت الفوري لـ Plugin ‏Voice Call.

    | الإعداد | مسار الإعدادات | الافتراضي |
    |---------|----------------|-----------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | الصوت | `...openai.voice` | `alloy` |
    | الحرارة | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يرجع إلى `OPENAI_API_KEY` |

    <Note>
    يدعم Azure OpenAI عبر مفتاحي الإعدادات `azureEndpoint` و`azureDeployment`. ويدعم الاستدعاء الثنائي الاتجاه للأدوات. ويستخدم تنسيق الصوت G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## إعدادات متقدمة

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw أسلوب WebSocket أولًا مع الرجوع الاحتياطي إلى SSE ‏(`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد المحاولة عند إخفاق WebSocket مبكر واحد قبل الرجوع إلى SSE
    - بعد الإخفاق، يضع علامة على WebSocket باعتباره متدهورًا لمدة ~60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق رؤوس هوية جلسة ودور مستقرة لعمليات إعادة المحاولة وإعادة الاتصال
    - يطبّع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر تنويعات النقل

    | القيمة | السلوك |
    |-------|--------|
    | `"auto"` (الافتراضي) | WebSocket أولًا، مع رجوع احتياطي إلى SSE |
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

  <Accordion title="الإحماء المسبق لـ WebSocket">
    يفعّل OpenClaw الإحماء المسبق لـ WebSocket افتراضيًا لـ `openai/*` لتقليل كمون الدور الأول.

    ```json5
    // تعطيل الإحماء المسبق
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
    - **الإعدادات:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند التفعيل، يربط OpenClaw الوضع السريع بالمعالجة ذات الأولوية في OpenAI ‏(`service_tier = "priority"`). ويتم الحفاظ على قيم `service_tier` الحالية، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

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
    تتغلب تجاوزات الجلسة على الإعدادات. وإزالة تجاوز الجلسة في واجهة Sessions تعيد الجلسة إلى الافتراضي المضبوط.
    </Note>

  </Accordion>

  <Accordion title="المعالجة ذات الأولوية (service_tier)">
    تكشف واجهة OpenAI API عن المعالجة ذات الأولوية عبر `service_tier`. اضبطها لكل نموذج في OpenClaw:

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
    لا يتم تمرير `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). وإذا مررت أيًا من الموفّرين عبر proxy، فإن OpenClaw يترك `service_tier` من دون تعديل.
    </Warning>

  </Accordion>

  <Accordion title="Compaction على جانب الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يفعّل OpenClaw تلقائيًا Compaction على جانب الخادم:

    - يفرض `store: true` ‏(ما لم تضبط compat الخاصة بالنموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - القيمة الافتراضية لـ `compact_threshold`: ‏70% من `contextWindow` ‏(أو `80000` عند عدم توفرها)

    <Tabs>
      <Tab title="التفعيل الصريح">
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
    يتحكم `responsesServerCompaction` فقط في حقن `context_management`. ولا تزال نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم تضبط compat القيمة `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="وضع GPT الوكيلي الصارم">
    بالنسبة إلى تشغيلات عائلة GPT-5 على `openai/*` و`openai-codex/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمن أكثر صرامة:

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
    - لم يعد يعتبر الدور الذي يحتوي على خطة فقط تقدمًا ناجحًا عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدور مع توجيه للتصرف الآن
    - يفعّل `update_plan` تلقائيًا للأعمال الكبيرة
    - يُظهر حالة تعذر صريحة إذا استمر النموذج في التخطيط من دون تصرف

    <Note>
    يقتصر ذلك على تشغيلات OpenAI وCodex الخاصة بعائلة GPT-5 فقط. أما الموفّرون الآخرون وعائلات النماذج الأقدم فتحتفظ بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يتعامل OpenClaw مع نقاط النهاية المباشرة لـ OpenAI وCodex وAzure OpenAI بشكل مختلف عن proxies العامة المتوافقة مع OpenAI ‏`/v1`:

    **المسارات الأصلية** (`openai/*` و`openai-codex/*` وAzure OpenAI):
    - تحافظ على `reasoning: { effort: "none" }` فقط للنماذج التي تدعم قيمة OpenAI ‏`none`
    - تحذف الاستدلال المعطل للنماذج أو proxies التي ترفض `reasoning.effort: "none"`
    - تجعل مخططات الأدوات افتراضيًا في الوضع الصارم
    - ترفق رؤوس إسناد مخفية على المضيفين الأصليين المتحقق منهم فقط
    - تحافظ على تشكيل الطلبات الخاص بـ OpenAI فقط (`service_tier` و`store` وreasoning-compat وتلميحات التخزين المؤقت للمطالبة)

    **المسارات المتوافقة/عبر proxy:**
    - تستخدم سلوك compat أكثر مرونة
    - لا تفرض مخططات أدوات صارمة ولا رؤوسًا أصلية فقط

    يستخدم Azure OpenAI النقل الأصلي وسلوك compat الأصلي، لكنه لا يتلقى رؤوس الإسناد المخفية.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار الموفّر.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
