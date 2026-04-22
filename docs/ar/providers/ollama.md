---
read_when:
    - أنت تريد تشغيل OpenClaw مع نماذج سحابية أو محلية عبر Ollama
    - أنت تحتاج إلى إرشادات إعداد وتهيئة Ollama
    - أنت تريد نماذج رؤية من Ollama لفهم الصور
summary: شغّل OpenClaw مع Ollama (النماذج السحابية والمحلية)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T04:28:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32623b6523f22930a5987fb22d2074f1e9bb274cc01ae1ad1837825cc04ec179
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

يتكامل OpenClaw مع API الأصلية لـ Ollama ‏(`/_api/chat`) للنماذج السحابية المستضافة وخوادم Ollama المحلية/المستضافة ذاتيًا. يمكنك استخدام Ollama بثلاثة أوضاع: `Cloud + Local` عبر مضيف Ollama يمكن الوصول إليه، أو `Cloud only` مقابل `https://ollama.com`، أو `Local only` مقابل مضيف Ollama يمكن الوصول إليه.

<Warning>
**مستخدمو Ollama البعيدون**: لا تستخدم عنوان URL المتوافق مع OpenAI من نوع `/v1` ‏(`http://host:11434/v1`) مع OpenClaw. فهذا يعطل استدعاء الأدوات وقد تُخرج النماذج JSON الأدوات الخام كنص عادي. استخدم عنوان URL الخاص بـ API الأصلية لـ Ollama بدلًا من ذلك: `baseUrl: "http://host:11434"` (من دون `/v1`).
</Warning>

## البدء

اختر طريقة الإعداد والوضع المفضلين لديك.

<Tabs>
  <Tab title="Onboarding (موصى به)">
    **الأفضل من أجل:** أسرع طريق إلى إعداد Ollama سحابي أو محلي يعمل.

    <Steps>
      <Step title="شغّل onboarding">
        ```bash
        openclaw onboard
        ```

        اختر **Ollama** من قائمة المزوّدين.
      </Step>
      <Step title="اختر وضعك">
        - **Cloud + Local** — مضيف Ollama محلي بالإضافة إلى نماذج سحابية موجّهة عبر ذلك المضيف
        - **Cloud only** — نماذج Ollama المستضافة عبر `https://ollama.com`
        - **Local only** — نماذج محلية فقط
      </Step>
      <Step title="اختر نموذجًا">
        يطلب `Cloud only` قيمة `OLLAMA_API_KEY` ويقترح القيم الافتراضية السحابية المستضافة. أما `Cloud + Local` و`Local only` فيطلبان عنوان URL الأساسي لـ Ollama، ويكتشفان النماذج المتاحة، ويسحبان النموذج المحلي المحدد تلقائيًا إذا لم يكن متاحًا بعد. ويتحقق `Cloud + Local` أيضًا مما إذا كان مضيف Ollama هذا قد سجّل الدخول للوصول السحابي.
      </Step>
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### الوضع غير التفاعلي

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    ويمكنك اختياريًا تحديد عنوان URL أساسي مخصص أو نموذج:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="إعداد يدوي">
    **الأفضل من أجل:** تحكم كامل في الإعداد السحابي أو المحلي.

    <Steps>
      <Step title="اختر السحابي أو المحلي">
        - **Cloud + Local**: ثبّت Ollama، وسجّل الدخول باستخدام `ollama signin`، ووجّه الطلبات السحابية عبر ذلك المضيف
        - **Cloud only**: استخدم `https://ollama.com` مع `OLLAMA_API_KEY`
        - **Local only**: ثبّت Ollama من [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="اسحب نموذجًا محليًا (Local only)">
        ```bash
        ollama pull gemma4
        # أو
        ollama pull gpt-oss:20b
        # أو
        ollama pull llama3.3
        ```
      </Step>
      <Step title="فعّل Ollama لـ OpenClaw">
        بالنسبة إلى `Cloud only`، استخدم `OLLAMA_API_KEY` الحقيقي. أما في الإعدادات المعتمدة على المضيف، فأي قيمة مكانية تعمل:

        ```bash
        # سحابي
        export OLLAMA_API_KEY="your-ollama-api-key"

        # محلي فقط
        export OLLAMA_API_KEY="ollama-local"

        # أو اضبطه في ملف الإعدادات
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="افحص نموذجك واضبطه">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        أو اضبط القيمة الافتراضية في الإعدادات:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## النماذج السحابية

<Tabs>
  <Tab title="Cloud + Local">
    يستخدم `Cloud + Local` مضيف Ollama يمكن الوصول إليه كنقطة تحكم لكل من النماذج المحلية والسحابية. وهذا هو التدفق الهجين المفضل لدى Ollama.

    استخدم **Cloud + Local** أثناء الإعداد. يطلب OpenClaw عنوان URL الأساسي لـ Ollama، ويكتشف النماذج المحلية من ذلك المضيف، ويتحقق مما إذا كان المضيف قد سجّل الدخول للوصول السحابي باستخدام `ollama signin`. وعندما يكون المضيف قد سجّل الدخول، يقترح OpenClaw أيضًا القيم السحابية الافتراضية المستضافة مثل `kimi-k2.5:cloud` و`minimax-m2.7:cloud` و`glm-5.1:cloud`.

    إذا لم يكن المضيف قد سجّل الدخول بعد، فسيُبقي OpenClaw الإعداد على الوضع المحلي فقط إلى أن تشغّل `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    يعمل `Cloud only` مقابل API المستضافة من Ollama على `https://ollama.com`.

    استخدم **Cloud only** أثناء الإعداد. يطلب OpenClaw قيمة `OLLAMA_API_KEY`، ويضبط `baseUrl: "https://ollama.com"`، ويزرع قائمة النماذج السحابية المستضافة. لا يتطلب هذا المسار **خادم Ollama محليًا** أو `ollama signin`.

    تُملأ قائمة النماذج السحابية المعروضة أثناء `openclaw onboard` مباشرة من `https://ollama.com/api/tags`، بحد أقصى 500 إدخال، بحيث يعكس المنتقي الفهرس المستضاف الحالي بدلًا من بذرة ثابتة. وإذا تعذر الوصول إلى `ollama.com` أو لم يُرجع أي نماذج وقت الإعداد، فسيعود OpenClaw إلى الاقتراحات المضمّنة السابقة حتى يكتمل onboarding.

  </Tab>

  <Tab title="Local only">
    في وضع المحلي فقط، يكتشف OpenClaw النماذج من نسخة Ollama المُعدّة. وهذا المسار مخصص لخوادم Ollama المحلية أو المستضافة ذاتيًا.

    يقترح OpenClaw حاليًا `gemma4` بوصفه القيمة المحلية الافتراضية.

  </Tab>
</Tabs>

## اكتشاف النماذج (مزوّد ضمني)

عندما تضبط `OLLAMA_API_KEY` (أو ملف auth profile) و**لا** تعرّف `models.providers.ollama`، يكتشف OpenClaw النماذج من نسخة Ollama المحلية على `http://127.0.0.1:11434`.

| السلوك             | التفاصيل                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| استعلام الفهرس        | يستعلم عن `/api/tags`                                                                                                                                                 |
| اكتشاف الإمكانيات | يستخدم عمليات lookup من نوع `/api/show` بأفضل جهد لقراءة `contextWindow` واكتشاف الإمكانيات (بما في ذلك الرؤية)                                                             |
| نماذج الرؤية        | تُعلَّم النماذج ذات إمكانية `vision` التي يُبلغ عنها `/api/show` على أنها قادرة على الصور (`input: ["text", "image"]`)، لذلك يحقن OpenClaw الصور تلقائيًا في prompt |
| اكتشاف reasoning  | يعلّم `reasoning` باستخدام heuristic لاسم النموذج (`r1` و`reasoning` و`think`)                                                                                          |
| حدود الرموز         | يضبط `maxTokens` على الحد الأقصى الافتراضي للرموز في Ollama المستخدم بواسطة OpenClaw                                                                                               |
| التكاليف                | يضبط جميع التكاليف على `0`                                                                                                                                               |

وهذا يتجنب إدخالات النماذج اليدوية مع إبقاء الفهرس متوافقًا مع نسخة Ollama المحلية.

```bash
# اعرف النماذج المتاحة
ollama list
openclaw models list
```

لإضافة نموذج جديد، ما عليك سوى سحبه باستخدام Ollama:

```bash
ollama pull mistral
```

سيُكتشف النموذج الجديد تلقائيًا ويصبح متاحًا للاستخدام.

<Note>
إذا ضبطت `models.providers.ollama` صراحةً، فسيتم تخطي الاكتشاف التلقائي ويجب عليك تعريف النماذج يدويًا. راجع قسم الإعدادات الصريحة أدناه.
</Note>

## الرؤية ووصف الصور

يسجّل Plugin Ollama المجمّع Ollama بوصفه provider لفهم الوسائط قادرًا على الصور. ويتيح هذا لـ OpenClaw توجيه طلبات وصف الصور الصريحة والقيم الافتراضية المُعدّة لنموذج الصور عبر نماذج الرؤية المحلية أو المستضافة من Ollama.

بالنسبة إلى الرؤية المحلية، اسحب نموذجًا يدعم الصور:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

ثم تحقق باستخدام infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

يجب أن يكون `--model` مرجعًا كاملًا بصيغة `<provider/model>`. وعند ضبطه، يشغّل `openclaw infer image describe` ذلك النموذج مباشرةً بدلًا من تخطي الوصف لأن النموذج يدعم الرؤية أصلًا.

ولجعل Ollama نموذج فهم الصور الافتراضي للوسائط الواردة، اضبط `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

إذا عرّفت `models.providers.ollama.models` يدويًا، فعلّم نماذج الرؤية بدعم إدخال الصور:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

يرفض OpenClaw طلبات وصف الصور للنماذج التي لم تُعلَّم على أنها قادرة على الصور. ومع الاكتشاف الضمني، يقرأ OpenClaw ذلك من Ollama عندما يُبلغ `/api/show` عن إمكانية رؤية.

## الإعدادات

<Tabs>
  <Tab title="أساسي (اكتشاف ضمني)">
    أبسط مسار لتفعيل الوضع المحلي فقط هو عبر متغير بيئة:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    إذا تم ضبط `OLLAMA_API_KEY`، فيمكنك حذف `apiKey` من إدخال المزوّد وسيملؤه OpenClaw لفحوصات التوفر.
    </Tip>

  </Tab>

  <Tab title="صريح (نماذج يدوية)">
    استخدم الإعدادات الصريحة عندما تريد إعدادًا سحابيًا مستضافًا، أو عندما تعمل Ollama على مضيف/منفذ آخر، أو عندما تريد فرض نوافذ سياق أو قوائم نماذج محددة، أو عندما تريد تعريفات نماذج يدوية بالكامل.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="عنوان URL أساسي مخصص">
    إذا كانت Ollama تعمل على مضيف أو منفذ مختلف (فالإعداد الصريح يعطل الاكتشاف التلقائي، لذا عرّف النماذج يدويًا):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // بدون /v1 - استخدم عنوان URL الخاص بـ API الأصلية لـ Ollama
            api: "ollama", // اضبطه صراحةً لضمان سلوك استدعاء الأدوات الأصلي
          },
        },
      },
    }
    ```

    <Warning>
    لا تضف `/v1` إلى عنوان URL. يستخدم المسار `/v1` الوضع المتوافق مع OpenAI، حيث لا يكون استدعاء الأدوات موثوقًا. استخدم عنوان Ollama الأساسي من دون لاحقة مسار.
    </Warning>

  </Tab>
</Tabs>

### اختيار النموذج

بمجرد الإعداد، تصبح جميع نماذج Ollama الخاصة بك متاحة:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web Search

يدعم OpenClaw **Ollama Web Search** بوصفه provider `web_search` مجمّعًا.

| الخاصية    | التفاصيل                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| المضيف        | يستخدم مضيف Ollama المُعدّ لديك (`models.providers.ollama.baseUrl` عند ضبطه، وإلا `http://127.0.0.1:11434`) |
| المصادقة        | بدون مفتاح                                                                                                          |
| المتطلب | يجب أن تكون Ollama قيد التشغيل وقد تم تسجيل الدخول باستخدام `ollama signin`                                                         |

اختر **Ollama Web Search** أثناء `openclaw onboard` أو `openclaw configure --section web`، أو اضبط:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
للاطلاع على تفاصيل الإعداد والسلوك الكاملة، راجع [Ollama Web Search](/ar/tools/ollama-search).
</Note>

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="الوضع القديم المتوافق مع OpenAI">
    <Warning>
    **استدعاء الأدوات غير موثوق في الوضع المتوافق مع OpenAI.** استخدم هذا الوضع فقط إذا كنت تحتاج إلى تنسيق OpenAI لوكيل proxy ولا تعتمد على سلوك استدعاء الأدوات الأصلي.
    </Warning>

    إذا كنت تحتاج إلى استخدام نقطة النهاية المتوافقة مع OpenAI بدلًا من ذلك (على سبيل المثال، خلف proxy لا يدعم إلا تنسيق OpenAI)، فاضبط `api: "openai-completions"` صراحةً:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // الافتراضي: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    قد لا يدعم هذا الوضع البث واستدعاء الأدوات في الوقت نفسه. وقد تحتاج إلى تعطيل البث باستخدام `params: { streaming: false }` في إعداد النموذج.

    عند استخدام `api: "openai-completions"` مع Ollama، يحقن OpenClaw القيمة `options.num_ctx` افتراضيًا حتى لا تعود Ollama بصمت إلى نافذة سياق 4096. وإذا كان proxy/upstream لديك يرفض حقول `options` غير المعروفة، فعطّل هذا السلوك:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="نوافذ السياق">
    بالنسبة إلى النماذج المكتشفة تلقائيًا، يستخدم OpenClaw نافذة السياق التي تُبلغ عنها Ollama عند توفرها، وإلا فإنه يعود إلى نافذة السياق الافتراضية لـ Ollama التي يستخدمها OpenClaw.

    يمكنك تجاوز `contextWindow` و`maxTokens` في إعداد provider الصريح:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="نماذج reasoning">
    يتعامل OpenClaw افتراضيًا مع النماذج التي تحمل أسماء مثل `deepseek-r1` أو `reasoning` أو `think` على أنها قادرة على reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    لا حاجة إلى أي إعداد إضافي -- إذ يعلّمها OpenClaw تلقائيًا.

  </Accordion>

  <Accordion title="تكاليف النموذج">
    Ollama مجانية وتعمل محليًا، لذلك يتم ضبط جميع تكاليف النماذج على $0. وينطبق هذا على كل من النماذج المكتشفة تلقائيًا والنماذج المعرّفة يدويًا.
  </Accordion>

  <Accordion title="تضمينات الذاكرة">
    يسجّل Plugin Ollama المجمّع provider لتضمينات الذاكرة من أجل
    [البحث في الذاكرة](/ar/concepts/memory). ويستخدم عنوان URL الأساسي
    ومفتاح API المُعدَّين لـ Ollama.

    | الخاصية      | القيمة               |
    | ------------- | ------------------- |
    | النموذج الافتراضي | `nomic-embed-text`  |
    | السحب التلقائي     | نعم — يتم سحب نموذج التضمين تلقائيًا إذا لم يكن موجودًا محليًا |

    لاختيار Ollama بوصفه provider تضمينات البحث في الذاكرة:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="إعدادات البث">
    يستخدم تكامل Ollama في OpenClaw **API الأصلية لـ Ollama** ‏(`/_api/chat`) افتراضيًا، وهي تدعم البث واستدعاء الأدوات بالكامل في الوقت نفسه. ولا حاجة إلى أي إعداد خاص.

    <Tip>
    إذا كنت تحتاج إلى استخدام نقطة النهاية المتوافقة مع OpenAI، فراجع قسم "الوضع القديم المتوافق مع OpenAI" أعلاه. قد لا يعمل البث واستدعاء الأدوات في الوقت نفسه في ذلك الوضع.
    </Tip>

  </Accordion>
</AccordionGroup>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم يتم اكتشاف Ollama">
    تأكد من أن Ollama قيد التشغيل وأنك قد ضبطت `OLLAMA_API_KEY` (أو auth profile)، وأنك **لم** تعرّف إدخال `models.providers.ollama` صريحًا:

    ```bash
    ollama serve
    ```

    تحقق من أن API يمكن الوصول إليها:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="لا توجد نماذج متاحة">
    إذا لم يكن نموذجك مدرجًا، فإما أن تسحب النموذج محليًا أو تعرّفه صراحةً في `models.providers.ollama`.

    ```bash
    ollama list  # اعرف ما هو مثبت
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # أو نموذج آخر
    ```

  </Accordion>

  <Accordion title="تم رفض الاتصال">
    تحقق من أن Ollama تعمل على المنفذ الصحيح:

    ```bash
    # تحقق مما إذا كانت Ollama قيد التشغيل
    ps aux | grep ollama

    # أو أعد تشغيل Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
للمزيد من المساعدة: [استكشاف الأخطاء وإصلاحها](/ar/help/troubleshooting) و[الأسئلة الشائعة](/ar/help/faq).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model providers" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع providers ومراجع النماذج وسلوك failover.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وإعدادها.
  </Card>
  <Card title="Ollama Web Search" href="/ar/tools/ollama-search" icon="magnifying-glass">
    تفاصيل الإعداد والسلوك الكاملة للبحث على الويب المدعوم بواسطة Ollama.
  </Card>
  <Card title="الإعدادات" href="/ar/gateway/configuration" icon="gear">
    المرجع الكامل للإعدادات.
  </Card>
</CardGroup>
