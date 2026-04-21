---
read_when:
    - أنت تريد استخدام Kimi من أجل `web_search`
    - أنت بحاجة إلى `KIMI_API_KEY` أو `MOONSHOT_API_KEY`
summary: بحث الويب في Kimi عبر بحث الويب في Moonshot
title: بحث Kimi
x-i18n:
    generated_at: "2026-04-21T07:27:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee0c8cd0e7c2edf8e05d22fbb5ef7338c9f68e7ac791eee024c73333936bb75a
    source_path: tools/kimi-search.md
    workflow: 15
---

# بحث Kimi

يدعم OpenClaw خدمة Kimi بوصفها موفّر `web_search`، باستخدام بحث الويب في Moonshot
لإنتاج إجابات مُولَّدة بالذكاء الاصطناعي مع الاستشهادات.

## الحصول على مفتاح API

<Steps>
  <Step title="أنشئ مفتاحًا">
    احصل على مفتاح API من [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="خزّن المفتاح">
    اضبط `KIMI_API_KEY` أو `MOONSHOT_API_KEY` في بيئة Gateway، أو
    قم بالإعداد عبر:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

عندما تختار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`، يمكن لـ OpenClaw أيضًا أن يطلب:

- منطقة Moonshot API:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- نموذج بحث الويب الافتراضي لـ Kimi (الافتراضي هو `kimi-k2.6`)

## الإعدادات

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
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

إذا كنت تستخدم مضيف China API للدردشة (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`)، فسيعيد OpenClaw استخدام المضيف نفسه لميزة
`web_search` الخاصة بـ Kimi عندما يكون `tools.web.search.kimi.baseUrl` محذوفًا، بحيث لا تصل المفاتيح من
[platform.moonshot.cn](https://platform.moonshot.cn/) إلى
نقطة النهاية الدولية عن طريق الخطأ (والتي كثيرًا ما تعيد HTTP 401). ويمكنك التجاوز
عبر `tools.web.search.kimi.baseUrl` عندما تحتاج إلى عنوان URL أساسي مختلف للبحث.

**بديل البيئة:** اضبط `KIMI_API_KEY` أو `MOONSHOT_API_KEY` في
بيئة Gateway. وبالنسبة إلى تثبيت gateway، ضعه في `~/.openclaw/.env`.

إذا حذفت `baseUrl`، فسيستخدم OpenClaw افتراضيًا `https://api.moonshot.ai/v1`.
وإذا حذفت `model`، فسيستخدم OpenClaw افتراضيًا `kimi-k2.6`.

## كيف يعمل

يستخدم Kimi بحث الويب في Moonshot لتوليد إجابات مع استشهادات مضمنة،
على نحو مشابه لأسلوب الاستجابة المؤسَّسة في Gemini وGrok.

## المعاملات المدعومة

يدعم بحث Kimi المعامل `query`.

يُقبل `count` من أجل التوافق مع `web_search` المشترك، لكن Kimi لا يزال
يعيد إجابة مُولَّدة واحدة مع الاستشهادات بدلًا من قائمة تحتوي على N من النتائج.

لا تُدعَم المرشحات الخاصة بالموفّر حاليًا.

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع الموفّرين والكشف التلقائي
- [Moonshot AI](/ar/providers/moonshot) -- وثائق موفّر نماذج Moonshot + Kimi Coding
- [بحث Gemini](/ar/tools/gemini-search) -- إجابات مُولَّدة بالذكاء الاصطناعي عبر الإسناد من Google
- [بحث Grok](/ar/tools/grok-search) -- إجابات مُولَّدة بالذكاء الاصطناعي عبر الإسناد من xAI
