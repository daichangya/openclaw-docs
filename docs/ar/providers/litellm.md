---
read_when:
    - تريد توجيه OpenClaw عبر LiteLLM proxy
    - تحتاج إلى تتبع التكلفة أو التسجيل أو توجيه النماذج عبر LiteLLM
summary: تشغيل OpenClaw عبر LiteLLM Proxy للوصول الموحد إلى النماذج وتتبع التكلفة
title: LiteLLM
x-i18n:
    generated_at: "2026-04-23T07:31:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f9665b204126861a7dbbd426b26a624e60fd219a44756cec6a023df73848cef
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) هو بوابة LLM مفتوحة المصدر توفر API موحدة لأكثر من 100 مزود نماذج. وجّه OpenClaw عبر LiteLLM للحصول على تتبع مركزي للتكلفة، والتسجيل، ومرونة تبديل البيئات الخلفية من دون تغيير تكوين OpenClaw.

<Tip>
**لماذا تستخدم LiteLLM مع OpenClaw؟**

- **تتبع التكلفة** — اعرف بالضبط ما ينفقه OpenClaw عبر جميع النماذج
- **توجيه النماذج** — بدّل بين Claude وGPT-4 وGemini وBedrock من دون تغييرات في التكوين
- **المفاتيح الافتراضية** — أنشئ مفاتيح مع حدود إنفاق لـ OpenClaw
- **التسجيل** — سجلات كاملة للطلبات/الاستجابات من أجل تصحيح الأخطاء
- **بدائل fallback** — تجاوز تلقائي للفشل إذا كان provider الأساسي لديك متوقفًا

</Tip>

## بداية سريعة

<Tabs>
  <Tab title="الإعداد الأولي (موصى به)">
    **الأفضل لـ:** أسرع مسار إلى إعداد LiteLLM يعمل.

    <Steps>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="إعداد يدوي">
    **الأفضل لـ:** تحكم كامل في التثبيت والتكوين.

    <Steps>
      <Step title="ابدأ LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="وجّه OpenClaw إلى LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        هذا كل شيء. يوجّه OpenClaw الآن عبر LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## التكوين

### متغيرات البيئة

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### ملف التكوين

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## موضوعات متقدمة

<AccordionGroup>
  <Accordion title="المفاتيح الافتراضية">
    أنشئ مفتاحًا مخصصًا لـ OpenClaw مع حدود إنفاق:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    استخدم المفتاح المُولَّد كـ `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="توجيه النماذج">
    يستطيع LiteLLM توجيه طلبات النماذج إلى بيئات خلفية مختلفة. اضبط ذلك في `config.yaml` الخاص بـ LiteLLM:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    يواصل OpenClaw طلب `claude-opus-4-6` — بينما يتولى LiteLLM التوجيه.

  </Accordion>

  <Accordion title="عرض الاستخدام">
    تحقّق من لوحة معلومات LiteLLM أو API:

    ```bash
    # معلومات المفتاح
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # سجلات الإنفاق
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="ملاحظات حول سلوك Proxy">
    - يعمل LiteLLM على `http://localhost:4000` افتراضيًا
    - يتصل OpenClaw عبر endpoint `/v1`
      المتوافق مع OpenAI وبنمط proxy الخاص بـ LiteLLM
    - لا ينطبق تشكيل الطلبات الأصلي الخاص بـ OpenAI فقط عبر LiteLLM:
      لا يوجد `service_tier`، ولا `store` الخاص بـ Responses، ولا تلميحات prompt-cache، ولا
      تشكيل حمولة reasoning-compat الخاص بـ OpenAI
    - لا تُحقن رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و`User-Agent`)
      على عناوين base URL المخصصة لـ LiteLLM
  </Accordion>
</AccordionGroup>

<Note>
للتكوين العام لموفري الخدمة وسلوك تجاوز الفشل، راجع [موفرو النماذج](/ar/concepts/model-providers).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="وثائق LiteLLM" href="https://docs.litellm.ai" icon="book">
    وثائق LiteLLM الرسمية ومرجع API.
  </Card>
  <Card title="موفرو النماذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع موفري الخدمة، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="التكوين" href="/ar/gateway/configuration" icon="gear">
    مرجع التكوين الكامل.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وتكوينها.
  </Card>
</CardGroup>
