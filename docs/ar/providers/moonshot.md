---
read_when:
    - تريد إعداد Moonshot K2 (Moonshot Open Platform) مقابل Kimi Coding
    - تحتاج إلى فهم نقاط النهاية والمفاتيح ومراجع النماذج المنفصلة
    - تريد إعدادات جاهزة للنسخ واللصق لأي من المزوّدين
summary: ضبط Moonshot K2 مقابل Kimi Coding (مزوّدان منفصلان + مفاتيح منفصلة)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-23T07:31:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a726df279bfc0351b8ab224e682b5c1e6e360440659e33e8568a94c351df51
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

يوفر Moonshot واجهة Kimi API مع نقاط نهاية متوافقة مع OpenAI. اضبط
المزوّد وحدد النموذج الافتراضي إلى `moonshot/kimi-k2.6`، أو استخدم
Kimi Coding مع `kimi/kimi-code`.

<Warning>
Moonshot وKimi Coding هما **مزوّدان منفصلان**. المفاتيح غير قابلة للتبادل، ونقاط النهاية مختلفة، ومراجع النماذج مختلفة (`moonshot/...` مقابل `kimi/...`).
</Warning>

## فهرس النماذج المضمّن

[//]: # "moonshot-kimi-k2-ids:start"

| مرجع النموذج                     | الاسم                  | الاستدلال | الإدخال      | السياق | الحد الأقصى للمخرجات |
| -------------------------------- | ---------------------- | --------- | ------------ | ------ | -------------------- |
| `moonshot/kimi-k2.6`             | Kimi K2.6              | لا        | نص، صورة     | 262,144 | 262,144 |
| `moonshot/kimi-k2.5`             | Kimi K2.5              | لا        | نص، صورة     | 262,144 | 262,144 |
| `moonshot/kimi-k2-thinking`      | Kimi K2 Thinking       | نعم       | نص           | 262,144 | 262,144 |
| `moonshot/kimi-k2-thinking-turbo`| Kimi K2 Thinking Turbo | نعم       | نص           | 262,144 | 262,144 |
| `moonshot/kimi-k2-turbo`         | Kimi K2 Turbo          | لا        | نص           | 256,000 | 16,384  |

[//]: # "moonshot-kimi-k2-ids:end"

تستخدم تقديرات التكلفة المضمّنة لنماذج K2 الحالية المستضافة على Moonshot
أسعار Moonshot المنشورة بنظام الدفع حسب الاستخدام: تبلغ تكلفة Kimi K2.6 مقدار $0.16/MTok عند إصابة cache hit،
و$0.95/MTok للإدخال، و$4.00/MTok للإخراج؛ بينما تبلغ تكلفة Kimi K2.5 مقدار $0.10/MTok عند إصابة cache hit،
و$0.60/MTok للإدخال، و$3.00/MTok للإخراج. أما إدخالات الفهرس القديمة الأخرى فتبقي
عناصر تكلفة صفرية نائبة ما لم تتجاوزها في config.

## البدء

اختر المزوّد واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Moonshot API">
    **الأفضل لـ:** نماذج Kimi K2 عبر Moonshot Open Platform.

    <Steps>
      <Step title="اختر منطقة نقطة النهاية">
        | خيار المصادقة         | نقطة النهاية                  | المنطقة |
        | -------------------- | ----------------------------- | ------- |
        | `moonshot-api-key`   | `https://api.moonshot.ai/v1`  | دولي    |
        | `moonshot-api-key-cn`| `https://api.moonshot.cn/v1`  | الصين   |
      </Step>
      <Step title="شغّل onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        أو لنقطة النهاية الخاصة بالصين:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="تحقق من توفر النماذج">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="شغّل اختبارًا حيًا سريعًا">
        استخدم دليل حالة معزولًا عندما تريد التحقق من الوصول إلى النموذج وتتبع
        التكلفة من دون لمس جلساتك المعتادة:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        يجب أن يبلّغ رد JSON عن `provider: "moonshot"` و
        `model: "kimi-k2.6"`. ويخزن إدخال transcript الخاص بالمساعد
        استخدام الرموز المطبّع بالإضافة إلى التكلفة المقدّرة تحت `usage.cost` عندما يعيد Moonshot
        بيانات الاستخدام الوصفية.
      </Step>
    </Steps>

    ### مثال config

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **الأفضل لـ:** المهام التي تركّز على البرمجة عبر نقطة نهاية Kimi Coding.

    <Note>
    يستخدم Kimi Coding مفتاح API مختلفًا وبادئة مزود مختلفة (`kimi/...`) عن Moonshot (`moonshot/...`). ولا يزال مرجع النموذج القديم `kimi/k2p5` مقبولًا كمعرّف توافق.
    </Note>

    <Steps>
      <Step title="شغّل onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### مثال config

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## البحث على الويب في Kimi

يشحن OpenClaw أيضًا **Kimi** كمزوّد `web_search`، مدعومًا ببحث Moonshot على الويب.

<Steps>
  <Step title="شغّل إعداد البحث على الويب التفاعلي">
    ```bash
    openclaw configure --section web
    ```

    اختر **Kimi** في قسم البحث على الويب لتخزين
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="اضبط منطقة البحث على الويب والنموذج">
    يطالبك الإعداد التفاعلي بما يلي:

    | الإعداد             | الخيارات |
    | ------------------- | -------- |
    | منطقة API           | `https://api.moonshot.ai/v1` (دولي) أو `https://api.moonshot.cn/v1` (الصين) |
    | نموذج البحث على الويب | يكون الافتراضي `kimi-k2.6` |

  </Step>
</Steps>

توجد الإعدادات تحت `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## متقدم

<AccordionGroup>
  <Accordion title="وضع التفكير الأصلي">
    يدعم Moonshot Kimi وضع تفكير أصليًا ثنائيًا:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    اضبطه لكل نموذج عبر `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    كما يربط OpenClaw مستويات `/think` في وقت التشغيل من أجل Moonshot:

    | مستوى `/think`       | سلوك Moonshot              |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | أي مستوى غير off     | `thinking.type=enabled`    |

    <Warning>
    عندما يكون التفكير في Moonshot مفعّلًا، يجب أن تكون `tool_choice` هي `auto` أو `none`. يقوم OpenClaw بتطبيع قيم `tool_choice` غير المتوافقة إلى `auto` من أجل التوافق.
    </Warning>

    يقبل Kimi K2.6 أيضًا حقلًا اختياريًا `thinking.keep` يتحكم في
    الاحتفاظ متعدد الأدوار بـ `reasoning_content`. اضبطه إلى `"all"` للاحتفاظ
    بالاستدلال الكامل عبر الأدوار؛ أو احذفه (أو اتركه `null`) لاستخدام
    استراتيجية الخادم الافتراضية. ولا يمرّر OpenClaw قيمة `thinking.keep` إلا إلى
    `moonshot/kimi-k2.6` ويزيلها من النماذج الأخرى.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="تنقية معرّفات استدعاء الأدوات">
    يقدّم Moonshot Kimi معرّفات `tool_call` أصلية على شكل `functions.<name>:<index>` عبر النقل المتوافق مع OpenAI. ولم يعد OpenClaw ينقّي هذه المعرّفات بشكل صارم من أجل Moonshot، بحيث تواصل التدفقات متعددة الأدوار للوكلاء عبر Kimi K2.6 العمل بعد جولتين أو ثلاث من استدعاءات الأدوات عندما تطابق طبقة التقديم المعرفات المشوّهة مع تعريفات الأدوات الأصلية.

    إذا احتاج مزوّد مخصص متوافق مع OpenAI إلى السلوك السابق، فاضبط `sanitizeToolCallIds: true` على إدخال المزوّد. توجد هذه العلامة على عائلة replay المشتركة `openai-compatible`؛ وقد تم توصيل Moonshot افتراضيًا بحالة إلغاء الاشتراك.

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="توافق استخدام البث">
    تعلن نقاط نهاية Moonshot الأصلية (`https://api.moonshot.ai/v1` و
    `https://api.moonshot.cn/v1`) عن توافق استخدام البث على
    النقل المشترك `openai-completions`. ويقوم OpenClaw بربط ذلك بإمكانات نقطة النهاية،
    لذلك ترث معرّفات المزوّدات المخصصة المتوافقة التي تستهدف مضيفات Moonshot الأصلية نفسها
    سلوك استخدام البث نفسه.

    ومع التسعير المضمّن لـ K2.6، فإن استخدام البث الذي يتضمن رموز الإدخال والإخراج
    ورموز قراءة cache يتحول أيضًا إلى تكلفة محلية تقديرية بالدولار الأمريكي لأوامر
    `/status` و`/usage full` و`/usage cost` ولمحاسبة الجلسات المدعومة بـ transcript.

  </Accordion>

  <Accordion title="مرجع نقطة النهاية ومرجع النموذج">
    | المزوّد | بادئة مرجع النموذج | نقطة النهاية | متغير بيئة المصادقة |
    | ------- | ------------------ | ------------ | ------------------- |
    | Moonshot | `moonshot/` | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY` |
    | Moonshot CN | `moonshot/` | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY` |
    | Kimi Coding | `kimi/` | نقطة نهاية Kimi Coding | `KIMI_API_KEY` |
    | البحث على الويب | N/A | مثل منطقة Moonshot API نفسها | `KIMI_API_KEY` أو `MOONSHOT_API_KEY` |

    - يستخدم البحث على الويب في Kimi المفتاح `KIMI_API_KEY` أو `MOONSHOT_API_KEY`، ويكون افتراضيًا على `https://api.moonshot.ai/v1` مع النموذج `kimi-k2.6`.
    - تجاوز بيانات التسعير والسياق الوصفية في `models.providers` عند الحاجة.
    - إذا نشرت Moonshot حدود سياق مختلفة لنموذج ما، فعدّل `contextWindow` وفقًا لذلك.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك الرجوع الاحتياطي.
  </Card>
  <Card title="البحث على الويب" href="/ar/tools/web" icon="magnifying-glass">
    إعداد مزوّدي البحث على الويب بما في ذلك Kimi.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعدادات الكامل للمزوّدين والنماذج وPlugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    إدارة مفاتيح Moonshot API والوثائق.
  </Card>
</CardGroup>
