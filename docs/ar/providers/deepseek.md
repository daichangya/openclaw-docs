---
read_when:
    - تريد استخدام DeepSeek مع OpenClaw
    - تحتاج إلى متغير البيئة لمفتاح API أو خيار المصادقة في CLI
summary: إعداد DeepSeek (المصادقة + اختيار النموذج)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:22:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b0d2345c72328e14351d71c5784204dc6ed9dc922f919b6adfac394001c3261
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) يوفّر نماذج ذكاء اصطناعي قوية عبر واجهة API متوافقة مع OpenAI.

| الخاصية | القيمة                     |
| -------- | -------------------------- |
| المزوّد | `deepseek`                 |
| المصادقة | `DEEPSEEK_API_KEY`         |
| API      | متوافق مع OpenAI          |
| عنوان URL الأساسي | `https://api.deepseek.com` |

## البدء

<Steps>
  <Step title="احصل على مفتاح API الخاص بك">
    أنشئ مفتاح API من [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="شغّل الإعداد الأوّلي">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    سيطلب هذا مفتاح API الخاص بك ويضبط `deepseek/deepseek-v4-flash` كنموذج افتراضي.

  </Step>
  <Step title="تحقق من توفّر النماذج">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="إعداد غير تفاعلي">
    بالنسبة إلى عمليات التثبيت المؤتمتة أو بدون واجهة، مرّر جميع العلامات مباشرة:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
إذا كان Gateway يعمل كخدمة daemon ‏(launchd/systemd)، فتأكد من أن `DEEPSEEK_API_KEY`
متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
`env.shellEnv`).
</Warning>

## الفهرس المدمج

| مرجع النموذج                | الاسم             | الإدخال | السياق    | الحد الأقصى للإخراج | ملاحظات                                   |
| ---------------------------- | ----------------- | ------- | --------- | ------------------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text    | 1,000,000 | 384,000             | النموذج الافتراضي؛ واجهة V4 تدعم التفكير |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text    | 1,000,000 | 384,000             | واجهة V4 تدعم التفكير                     |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text    | 131,072   | 8,192               | واجهة DeepSeek V3.2 بدون تفكير            |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text    | 131,072   | 65,536              | واجهة V3.2 مع تمكين الاستدلال             |

<Tip>
تدعم نماذج V4 عنصر التحكم `thinking` الخاص بـ DeepSeek. كما يعيد OpenClaw أيضًا
تشغيل `reasoning_content` من DeepSeek في الأدوار اللاحقة حتى تتمكن جلسات التفكير
التي تتضمن استدعاءات الأدوات من الاستمرار.
</Tip>

## مثال على الإعداد

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعدادات الكامل للوكلاء والنماذج والمزوّدين.
  </Card>
</CardGroup>
