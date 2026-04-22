---
read_when:
    - أنت تريد استخدام Vercel AI Gateway مع OpenClaw
    - أنت بحاجة إلى متغير البيئة الخاص بمفتاح API أو خيار المصادقة في CLI
summary: إعداد Vercel AI Gateway (المصادقة + اختيار النموذج)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-22T04:28:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

يوفّر [Vercel AI Gateway](https://vercel.com/ai-gateway) واجهة API موحّدة
للوصول إلى مئات النماذج عبر نقطة نهاية واحدة.

| الخاصية      | القيمة                           |
| ------------- | -------------------------------- |
| المزود        | `vercel-ai-gateway`              |
| المصادقة      | `AI_GATEWAY_API_KEY`             |
| API           | متوافق مع Anthropic Messages     |
| فهرس النماذج  | يتم اكتشافه تلقائيًا عبر `/v1/models` |

<Tip>
يكتشف OpenClaw تلقائيًا فهرس Gateway عند `/v1/models`، لذا
يتضمن `/models vercel-ai-gateway` مراجع النماذج الحالية مثل
`vercel-ai-gateway/openai/gpt-5.4` و
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## البدء

<Steps>
  <Step title="تعيين مفتاح API">
    شغّل الإعداد الأولي واختر خيار مصادقة AI Gateway:

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="تعيين نموذج افتراضي">
    أضف النموذج إلى config الخاص بـ OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="التحقق من توفر النموذج">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## مثال غير تفاعلي

بالنسبة إلى الإعدادات المعتمدة على السكربتات أو CI، مرّر جميع القيم عبر سطر الأوامر:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## الاختصار الخاص بمعرّف النموذج

يقبل OpenClaw مراجع نماذج Claude المختصرة الخاصة بـ Vercel ويقوم بتطبيعها في
وقت التشغيل:

| الإدخال المختصر                     | مرجع النموذج المطبّع                           |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
يمكنك استخدام الصيغة المختصرة أو مرجع النموذج المؤهل بالكامل في
الإعدادات الخاصة بك. يقوم OpenClaw بحل الصيغة الأساسية تلقائيًا.
</Tip>

## ملاحظات متقدمة

<AccordionGroup>
  <Accordion title="متغير البيئة لعمليات daemon">
    إذا كان OpenClaw Gateway يعمل كعملية daemon (launchd/systemd)، فتأكد من أن
    `AI_GATEWAY_API_KEY` متاح لتلك العملية.

    <Warning>
    لن يكون المفتاح المعيّن فقط في `~/.profile` مرئيًا لعملية daemon تعمل عبر launchd/systemd
    ما لم يتم استيراد تلك البيئة صراحةً. عيّن المفتاح في
    `~/.openclaw/.env` أو عبر `env.shellEnv` لضمان أن تتمكن عملية gateway من
    قراءته.
    </Warning>

  </Accordion>

  <Accordion title="توجيه المزود">
    يوجّه Vercel AI Gateway الطلبات إلى المزود upstream استنادًا إلى بادئة
    مرجع النموذج. على سبيل المثال، يقوم `vercel-ai-gateway/anthropic/claude-opus-4.6` بالتوجيه
    عبر Anthropic، بينما يتم توجيه `vercel-ai-gateway/openai/gpt-5.4` عبر
    OpenAI ويتم توجيه `vercel-ai-gateway/moonshotai/kimi-k2.6` عبر
    MoonshotAI. يتولى `AI_GATEWAY_API_KEY` الواحد لديك المصادقة لجميع
    المزودين upstream.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزودين، ومراجع النماذج، وسلوك الاسترداد.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    استكشاف الأخطاء العام والأسئلة الشائعة.
  </Card>
</CardGroup>
