---
read_when:
    - تريد إعداد Moonshot K2 ‏(Moonshot Open Platform) مقابل Kimi Coding
    - تحتاج إلى فهم نقاط النهاية والمفاتيح ومراجع النماذج المنفصلة
    - تريد إعدادًا جاهزًا للنسخ/اللصق لأيٍّ من المزوّدين
summary: تهيئة Moonshot K2 مقابل Kimi Coding ‏(مزوّدون ومفاتيح منفصلة)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-21T07:26:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a04b0c45d55dbf8d56a04a1811f0850b800842ea501b212d44b53ff0680b5a2
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI ‏(Kimi)

توفّر Moonshot واجهة Kimi API مع نقاط نهاية متوافقة مع OpenAI. قم بتهيئة
المزوّد واضبط النموذج الافتراضي على `moonshot/kimi-k2.6`، أو استخدم
Kimi Coding مع `kimi/kimi-code`.

<Warning>
إن Moonshot وKimi Coding هما **مزوّدان منفصلان**. المفاتيح غير قابلة للتبادل، ونقاط النهاية مختلفة، ومراجع النماذج مختلفة (`moonshot/...` مقابل `kimi/...`).
</Warning>

## كتالوج النماذج المدمج

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | الاسم                  | الاستدلال | الإدخال      | السياق | الحد الأقصى للإخراج |
| --------------------------------- | ---------------------- | --------- | ------------ | ------ | ------------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | لا        | نص، صورة     | 262,144 | 262,144            |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | لا        | نص، صورة     | 262,144 | 262,144            |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | نعم       | نص           | 262,144 | 262,144            |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | نعم       | نص           | 262,144 | 262,144            |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | لا        | نص           | 256,000 | 16,384             |

[//]: # "moonshot-kimi-k2-ids:end"

تستخدم تقديرات التكلفة المجمعة لنماذج K2 المستضافة حاليًا على Moonshot
أسعار Moonshot المنشورة للدفع حسب الاستخدام: تبلغ تكلفة Kimi K2.6 مقدار $0.16/MTok لقراءة cache،
و$0.95/MTok للإدخال، و$4.00/MTok للإخراج؛ أما Kimi K2.5 فتبلغ $0.10/MTok لقراءة cache،
و$0.60/MTok للإدخال، و$3.00/MTok للإخراج. أما إدخالات الكتالوج القديمة الأخرى
فتحتفظ بعناصر تكلفة صفرية مؤقتة ما لم تتجاوزها في الإعداد.

## البدء

اختر المزوّد واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Moonshot API">
    **الأفضل لـ:** نماذج Kimi K2 عبر Moonshot Open Platform.

    <Steps>
      <Step title="اختر منطقة نقطة النهاية">
        | خيار المصادقة         | نقطة النهاية                  | المنطقة        |
        | --------------------- | ----------------------------- | -------------- |
        | `moonshot-api-key`    | `https://api.moonshot.ai/v1`  | دولية          |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1`  | الصين          |
      </Step>
      <Step title="شغّل الإعداد الأولي">
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
      <Step title="شغّل اختبار دخان حي">
        استخدم دليل حالة معزولًا عندما تريد التحقق من الوصول إلى النموذج وتتبع
        التكلفة من دون لمس جلساتك العادية:

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
        `model: "kimi-k2.6"`. ويخزّن إدخال سجل المساعد استخدام
        tokens الموحّد بالإضافة إلى التكلفة المقدّرة ضمن `usage.cost` عندما تعيد Moonshot
        بيانات usage الوصفية.
      </Step>
    </Steps>

    ### مثال إعداد

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
    **الأفضل لـ:** المهام البرمجية المركزة عبر نقطة نهاية Kimi Coding.

    <Note>
    يستخدم Kimi Coding مفتاح API مختلفًا وبادئة مزوّد مختلفة (`kimi/...`) عن Moonshot ‏(`moonshot/...`). ولا يزال مرجع النموذج القديم `kimi/k2p5` مقبولًا كمعرّف توافق.
    </Note>

    <Steps>
      <Step title="شغّل الإعداد الأولي">
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

    ### مثال إعداد

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

## بحث الويب في Kimi

يشحن OpenClaw أيضًا **Kimi** كمزوّد `web_search`، مدعومًا ببحث الويب من Moonshot.

<Steps>
  <Step title="شغّل الإعداد التفاعلي لبحث الويب">
    ```bash
    openclaw configure --section web
    ```

    اختر **Kimi** في قسم web-search لتخزين
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="هيئ منطقة بحث الويب والنموذج">
    يطلب الإعداد التفاعلي ما يلي:

    | الإعداد              | الخيارات                                                             |
    | -------------------- | -------------------------------------------------------------------- |
    | منطقة API            | `https://api.moonshot.ai/v1` (دولية) أو `https://api.moonshot.cn/v1` (الصين) |
    | نموذج بحث الويب      | القيمة الافتراضية `kimi-k2.6`                                       |

  </Step>
</Steps>

يوجد الإعداد ضمن `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // أو استخدم KIMI_API_KEY / MOONSHOT_API_KEY
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
    يدعم Moonshot Kimi وضع التفكير الأصلي الثنائي:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    هيئه لكل نموذج عبر `agents.defaults.models.<provider/model>.params`:

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

    كما يربط OpenClaw مستويات `/think` وقت التشغيل لـ Moonshot:

    | مستوى `/think`       | سلوك Moonshot              |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | أي مستوى غير off     | `thinking.type=enabled`    |

    <Warning>
    عند تفعيل التفكير في Moonshot، يجب أن تكون `tool_choice` مساوية لـ `auto` أو `none`. يقوم OpenClaw بتطبيع قيم `tool_choice` غير المتوافقة إلى `auto` من أجل التوافق.
    </Warning>

    يقبل Kimi K2.6 أيضًا حقلًا اختياريًا `thinking.keep` يتحكم في
    الاحتفاظ متعدد الأدوار بـ `reasoning_content`. اضبطه على `"all"` للاحتفاظ
    بالتفكير الكامل عبر الأدوار؛ أو احذفه (أو اتركه `null`) لاستخدام
    الاستراتيجية الافتراضية للخادم. ولا يمرر OpenClaw قيمة `thinking.keep` إلا إلى
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

  <Accordion title="توافق usage مع البث">
    تعلن نقاط نهاية Moonshot الأصلية (`https://api.moonshot.ai/v1` و
    `https://api.moonshot.cn/v1`) عن توافق usage مع البث على
    النقل المشترك `openai-completions`. ويعتمد OpenClaw ذلك على قدرات نقطة النهاية،
    لذا فإن معرّفات المزوّدات المخصصة المتوافقة التي تستهدف مضيفي
    Moonshot الأصليين أنفسهم ترث سلوك usage مع البث نفسه.

    ومع تسعير K2.6 المدمج، يُحوَّل usage المتدفق الذي يتضمن tokens الإدخال
    والإخراج وقراءة cache أيضًا إلى تكلفة USD محلية تقديرية من أجل
    `/status` و`/usage full` و`/usage cost` ومحاسبة الجلسات المعتمدة على
    السجل.

  </Accordion>

  <Accordion title="مرجع نقطة النهاية ومرجع النموذج">
    | المزوّد      | بادئة Model ref | نقطة النهاية                 | متغير env للمصادقة |
    | ------------ | --------------- | ---------------------------- | ------------------ |
    | Moonshot     | `moonshot/`     | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY` |
    | Moonshot CN  | `moonshot/`     | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY` |
    | Kimi Coding  | `kimi/`         | نقطة نهاية Kimi Coding       | `KIMI_API_KEY`     |
    | بحث الويب    | N/A             | نفس منطقة Moonshot API       | `KIMI_API_KEY` أو `MOONSHOT_API_KEY` |

    - يستخدم بحث الويب في Kimi قيمة `KIMI_API_KEY` أو `MOONSHOT_API_KEY`، ويستخدم افتراضيًا `https://api.moonshot.ai/v1` مع النموذج `kimi-k2.6`.
    - تجاوز بيانات التسعير وبيانات السياق الوصفية في `models.providers` عند الحاجة.
    - إذا نشرت Moonshot حدود سياق مختلفة لنموذج ما، فعدّل `contextWindow` وفقًا لذلك.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك التحويل الاحتياطي.
  </Card>
  <Card title="بحث الويب" href="/tools/web-search" icon="magnifying-glass">
    تهيئة مزوّدي بحث الويب بما في ذلك Kimi.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    schema الإعداد الكامل للمزوّدين والنماذج وPlugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    إدارة مفاتيح Moonshot API والوثائق.
  </Card>
</CardGroup>
