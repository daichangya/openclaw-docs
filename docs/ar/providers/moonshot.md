---
read_when:
    - تريد إعداد Moonshot K2 ‏(Moonshot Open Platform) مقابل Kimi Coding
    - أنت بحاجة إلى فهم نقاط النهاية والمفاتيح ومراجع النماذج المنفصلة
    - تريد إعدادات جاهزة للنسخ واللصق لأي من الموفّرين
summary: تهيئة Moonshot K2 مقابل Kimi Coding (موفّران منفصلان + مفاتيح منفصلة)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-25T13:56:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd6ababe59354a302975b68f4cdb12a623647f8e5cadfb8ae58a74bb2934ce65
    source_path: providers/moonshot.md
    workflow: 15
---

توفّر Moonshot واجهة Kimi API مع نقاط نهاية متوافقة مع OpenAI. اضبط
الموفّر وعيّن النموذج الافتراضي إلى `moonshot/kimi-k2.6`، أو استخدم
Kimi Coding مع `kimi/kimi-code`.

<Warning>
Moonshot وKimi Coding هما **موفّران منفصلان**. المفاتيح غير قابلة للتبادل، ونقاط النهاية تختلف، ومراجع النماذج تختلف (`moonshot/...` مقابل `kimi/...`).
</Warning>

## كتالوج النماذج المدمج

[//]: # "moonshot-kimi-k2-ids:start"

| مرجع النموذج                     | الاسم                  | الاستدلال | الإدخال     | السياق | الحد الأقصى للإخراج |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | لا        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | لا        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | نعم       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | نعم       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | لا        | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

تستخدم تقديرات التكلفة المجمّعة لنماذج K2 الحالية المستضافة على Moonshot
أسعار الدفع حسب الاستخدام المنشورة من Moonshot: تبلغ تكلفة Kimi K2.6
‏$0.16/MTok لقراءة cache، و$0.95/MTok للإدخال، و$4.00/MTok للإخراج؛
وتبلغ تكلفة Kimi K2.5 ‏$0.10/MTok لقراءة cache،
و$0.60/MTok للإدخال، و$3.00/MTok للإخراج. أما إدخالات الكتالوج القديمة الأخرى
فتبقي عناصر تكلفة صفرية افتراضية ما لم تستبدلها في الإعدادات.

## البدء

اختر الموفّر واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Moonshot API">
    **الأفضل لـ:** نماذج Kimi K2 عبر Moonshot Open Platform.

    <Steps>
      <Step title="اختر منطقة نقطة النهاية">
        | خيار المصادقة         | نقطة النهاية                   | المنطقة       |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | دولي |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | الصين         |
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
      <Step title="عيّن نموذجًا افتراضيًا">
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
      <Step title="تحقق من أن النماذج متاحة">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="شغّل اختبار smoke حي">
        استخدم دليل حالة معزولًا عندما تريد التحقق من الوصول إلى النموذج
        وتتبع التكلفة من دون المساس بجلساتك العادية:

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
        `model: "kimi-k2.6"`. ويخزّن إدخال سجل المساعد
        استخدام الرموز المطبّع بالإضافة إلى التكلفة التقديرية تحت `usage.cost` عندما تعيد Moonshot
        بيانات استخدام وصفية.
      </Step>
    </Steps>

    ### مثال على الإعدادات

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
    **الأفضل لـ:** المهام المركّزة على البرمجة عبر نقطة نهاية Kimi Coding.

    <Note>
    يستخدم Kimi Coding مفتاح API مختلفًا وبادئة موفّر مختلفة (`kimi/...`) عن Moonshot ‏(`moonshot/...`). ويظل مرجع النموذج القديم `kimi/k2p5` مقبولًا كمعرّف توافق.
    </Note>

    <Steps>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="عيّن نموذجًا افتراضيًا">
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
      <Step title="تحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### مثال على الإعدادات

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

يشحن OpenClaw أيضًا **Kimi** كموفّر `web_search`، ومدعومًا ببحث Moonshot
على الويب.

<Steps>
  <Step title="شغّل الإعداد التفاعلي للبحث على الويب">
    ```bash
    openclaw configure --section web
    ```

    اختر **Kimi** في قسم البحث على الويب لتخزين
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="اضبط منطقة البحث على الويب والنموذج">
    يطلب الإعداد التفاعلي ما يلي:

    | الإعداد             | الخيارات                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | منطقة API          | `https://api.moonshot.ai/v1` (دولي) أو `https://api.moonshot.cn/v1` (الصين) |
    | نموذج البحث على الويب    | الافتراضي هو `kimi-k2.6`                                             |

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

## إعدادات متقدمة

<AccordionGroup>
  <Accordion title="وضع Thinking الأصلي">
    يدعم Moonshot Kimi وضع Thinking الأصلي الثنائي:

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
    عند تمكين Thinking في Moonshot، يجب أن تكون `tool_choice` إما `auto` أو `none`. يقوم OpenClaw بتطبيع قيم `tool_choice` غير المتوافقة إلى `auto` من أجل التوافق.
    </Warning>

    يقبل Kimi K2.6 أيضًا الحقل الاختياري `thinking.keep` الذي يتحكم في
    الاحتفاظ متعدد الأدوار بـ `reasoning_content`. اضبطه إلى `"all"` للاحتفاظ بجميع
    الاستدلالات عبر الأدوار؛ أو احذفه (أو اتركه `null`) لاستخدام
    استراتيجية الخادم الافتراضية. لا يمرّر OpenClaw الحقل `thinking.keep` إلا إلى
    `moonshot/kimi-k2.6` ويزيله من النماذج الأخرى.

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
    يقدّم Moonshot Kimi معرّفات `tool_call` بالشكل `functions.<name>:<index>`. يحافظ OpenClaw عليها كما هي بحيث يظل استخدام الأدوات متعدد الأدوار يعمل.

    لفرض تنقية صارمة على معرّفات استدعاء الأدوات لموفّر مخصص متوافق مع OpenAI، اضبط `sanitizeToolCallIds: true`:

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
    وسيلة النقل المشتركة `openai-completions`. يربط OpenClaw ذلك
    بإمكانات نقطة النهاية، لذا فإن معرّفات الموفّر المخصصة المتوافقة التي تستهدف مضيفي
    Moonshot الأصليين أنفسهم ترث سلوك استخدام البث نفسه.

    ومع تسعير K2.6 المجمّع، يُحوَّل الاستخدام المبثوث الذي يتضمن رموز الإدخال
    والإخراج وقراءة cache أيضًا إلى تكلفة محلية تقديرية بالدولار الأمريكي من أجل
    `/status` و`/usage full` و`/usage cost`، ومحاسبة الجلسات
    المعتمدة على السجل.

  </Accordion>

  <Accordion title="مرجع نقطة النهاية ومرجع النموذج">
    | الموفّر   | بادئة مرجع النموذج | نقطة النهاية                  | متغير بيئة المصادقة |
    | ---------- | ------------------ | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`        | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`        | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`            | نقطة نهاية Kimi Coding        | `KIMI_API_KEY`      |
    | البحث على الويب | N/A          | نفس منطقة Moonshot API        | `KIMI_API_KEY` أو `MOONSHOT_API_KEY` |

    - يستخدم بحث Kimi على الويب `KIMI_API_KEY` أو `MOONSHOT_API_KEY`، ويكون افتراضيًا على `https://api.moonshot.ai/v1` مع النموذج `kimi-k2.6`.
    - استبدل بيانات التسعير وبيانات السياق الوصفية في `models.providers` عند الحاجة.
    - إذا نشرت Moonshot حدود سياق مختلفة لنموذج ما، فعدّل `contextWindow` وفقًا لذلك.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="البحث على الويب" href="/ar/tools/web" icon="magnifying-glass">
    تهيئة موفّري البحث على الويب بما في ذلك Kimi.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعدادات الكامل للموفّرين، والنماذج، وPlugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    إدارة مفاتيح API الخاصة بـ Moonshot والوثائق.
  </Card>
</CardGroup>
