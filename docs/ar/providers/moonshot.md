---
read_when:
    - تريد إعداد Moonshot K2 ‏(Moonshot Open Platform) مقابل Kimi Coding
    - تحتاج إلى فهم نقاط النهاية والمفاتيح ومراجع النماذج المنفصلة
    - تريد إعدادات جاهزة للنسخ واللصق لأي من المزوّدين
summary: تهيئة Moonshot K2 مقابل Kimi Coding (مزودون منفصلون + مفاتيح منفصلة)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-23T14:02:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: e143632de7aff050f32917e379e21ace5f4a5f9857618ef720f885f2f298ca72
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

توفر Moonshot واجهة Kimi API مع نقاط نهاية متوافقة مع OpenAI. اضبط
المزوّد وحدد النموذج الافتراضي إلى `moonshot/kimi-k2.6`، أو استخدم
Kimi Coding مع `kimi/kimi-code`.

<Warning>
Moonshot وKimi Coding هما **مزودان منفصلان**. المفاتيح غير قابلة للتبادل، ونقاط النهاية تختلف، ومراجع النماذج تختلف (`moonshot/...` مقابل `kimi/...`).
</Warning>

## كتالوج النماذج المضمّن

[//]: # "moonshot-kimi-k2-ids:start"

| مرجع النموذج                         | الاسم                   | Reasoning | الإدخال       | السياق | الحد الأقصى للإخراج |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | لا        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | لا        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | نعم       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | نعم       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | لا        | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

تستخدم تقديرات التكلفة المضمّنة لنماذج K2 الحالية المستضافة على Moonshot
أسعار Moonshot المنشورة بنظام الدفع حسب الاستخدام: تبلغ تكلفة Kimi K2.6
‏$0.16/MTok لقراءة cache، و$0.95/MTok للإدخال، و$4.00/MTok للإخراج؛ وتبلغ تكلفة Kimi K2.5
‏$0.10/MTok لقراءة cache، و$0.60/MTok للإدخال، و$3.00/MTok للإخراج. أما إدخالات الكتالوج
القديمة الأخرى فتبقى بعناصر نائبة بتكلفة صفرية ما لم تتجاوزها في config.

## البدء

اختر مزوّدك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Moonshot API">
    **الأفضل لـ:** نماذج Kimi K2 عبر Moonshot Open Platform.

    <Steps>
      <Step title="اختر منطقة نقطة النهاية">
        | خيار auth            | نقطة النهاية                       | المنطقة        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | دولي |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | الصين         |
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        أو لنقطة نهاية الصين:

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
      <Step title="شغّل اختبار smoke حي">
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
        `model: "kimi-k2.6"`. ويخزن إدخال سجل المساعد المطبّع
        استخدام tokens بالإضافة إلى التكلفة التقديرية تحت `usage.cost` عندما تعيد Moonshot
        بيانات usage الوصفية.
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
    **الأفضل لـ:** المهام التي تركز على البرمجة عبر نقطة نهاية Kimi Coding.

    <Note>
    يستخدم Kimi Coding مفتاح API مختلفًا وبادئة مزوّد مختلفة (`kimi/...`) عن Moonshot ‏(`moonshot/...`). وما يزال مرجع النموذج القديم `kimi/k2p5` مقبولًا كمعرّف توافق.
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

## بحث الويب في Kimi

يشحن OpenClaw أيضًا **Kimi** كمزوّد `web_search`، ومدعومًا ببحث الويب
في Moonshot.

<Steps>
  <Step title="شغّل إعداد بحث الويب التفاعلي">
    ```bash
    openclaw configure --section web
    ```

    اختر **Kimi** في قسم بحث الويب لتخزين
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="اضبط منطقة بحث الويب والنموذج">
    يطلب الإعداد التفاعلي ما يلي:

    | الإعداد             | الخيارات                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | منطقة API          | `https://api.moonshot.ai/v1` (دولي) أو `https://api.moonshot.cn/v1` (الصين) |
    | نموذج بحث الويب    | القيمة الافتراضية هي `kimi-k2.6`                                             |

  </Step>
</Steps>

يوجد config تحت `plugins.entries.moonshot.config.webSearch`:

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
  <Accordion title="وضع thinking الأصلي">
    يدعم Moonshot Kimi وضع thinking أصليًا ثنائيًا:

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

    يربط OpenClaw أيضًا مستويات `/think` وقت التشغيل لـ Moonshot:

    | مستوى `/think`       | سلوك Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | أي مستوى غير off    | `thinking.type=enabled`    |

    <Warning>
    عند تفعيل thinking في Moonshot، يجب أن تكون `tool_choice` هي `auto` أو `none`. يقوم OpenClaw بتطبيع قيم `tool_choice` غير المتوافقة إلى `auto` من أجل التوافق.
    </Warning>

    يقبل Kimi K2.6 أيضًا الحقل الاختياري `thinking.keep` الذي يتحكم في
    الاحتفاظ متعدد الأدوار بـ `reasoning_content`. اضبطه إلى `"all"` للاحتفاظ
    بـ reasoning الكامل عبر الأدوار؛ أو احذفه (أو اتركه `null`) لاستخدام
    استراتيجية الخادم الافتراضية. لا يمرر OpenClaw قيمة `thinking.keep` إلا لـ
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

  <Accordion title="تنقية معرّف استدعاء الأداة">
    يقدّم Moonshot Kimi معرّفات tool_call بالشكل `functions.<name>:<index>`. ويحافظ OpenClaw عليها كما هي بحيث تستمر استدعاءات الأدوات متعددة الأدوار في العمل.

    لفرض التنقية الصارمة على مزوّد مخصص متوافق مع OpenAI، اضبط `sanitizeToolCallIds: true`:

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
    تعلن نقاط النهاية الأصلية لـ Moonshot ‏(`https://api.moonshot.ai/v1` و
    `https://api.moonshot.cn/v1`) عن توافق streaming usage على
    نقل `openai-completions` المشترك. يربط OpenClaw ذلك بإمكانات نقطة النهاية،
    لذلك ترث معرّفات المزودات المخصصة المتوافقة التي تستهدف نفس مضيفي Moonshot
    الأصليين سلوك streaming-usage نفسه.

    ومع تسعير K2.6 المضمّن، يتم أيضًا تحويل usage المتدفقة التي تتضمن tokens الإدخال
    والإخراج وقراءة cache إلى تكلفة محلية تقديرية بالدولار الأمريكي من أجل
    `/status` و`/usage full` و`/usage cost` ومحاسبة الجلسة المدعومة بالسجل.

  </Accordion>

  <Accordion title="مرجع نقطة النهاية ومرجع النموذج">
    | المزوّد   | بادئة مرجع النموذج | نقطة النهاية                      | متغير env للمصادقة        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | نقطة نهاية Kimi Coding          | `KIMI_API_KEY`      |
    | بحث الويب | N/A              | نفس منطقة Moonshot API   | `KIMI_API_KEY` أو `MOONSHOT_API_KEY` |

    - يستخدم بحث الويب في Kimi القيمة `KIMI_API_KEY` أو `MOONSHOT_API_KEY`، ويكون افتراضيًا على `https://api.moonshot.ai/v1` مع النموذج `kimi-k2.6`.
    - تجاوز بيانات التسعير وبيانات السياق الوصفية في `models.providers` عند الحاجة.
    - إذا نشرت Moonshot حدود سياق مختلفة لنموذج ما، فاضبط `contextWindow` وفقًا لذلك.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزودات، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="بحث الويب" href="/ar/tools/web" icon="magnifying-glass">
    تهيئة مزودات بحث الويب بما في ذلك Kimi.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط config الكامل للمزودات والنماذج وPlugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    إدارة مفاتيح Moonshot API والوثائق.
  </Card>
</CardGroup>
