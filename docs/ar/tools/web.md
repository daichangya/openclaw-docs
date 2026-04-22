---
read_when:
    - تريد تمكين `web_search` أو تكوينه
    - تريد تمكين `x_search` أو تكوينه
    - تحتاج إلى اختيار مزوّد بحث
    - تريد فهم الاكتشاف التلقائي وfallback المزوّد
sidebarTitle: Web Search
summary: '`web_search` و`x_search` و`web_fetch` — ابحث في الويب، أو ابحث في منشورات X، أو اجلب محتوى الصفحة'
title: بحث الويب
x-i18n:
    generated_at: "2026-04-22T04:29:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2517d660465f850b1cfdd255fbf512dc5c828b1ef22e3b24cec6aab097ebd5
    source_path: tools/web.md
    workflow: 15
---

# بحث الويب

تقوم أداة `web_search` بالبحث في الويب باستخدام المزوّد الذي قمت بتكوينه
وتُرجع النتائج. ويتم تخزين النتائج مؤقتًا حسب الاستعلام لمدة 15 دقيقة (قابلة للتكوين).

يتضمن OpenClaw أيضًا `x_search` لمنشورات X (المعروف سابقًا باسم Twitter) و
`web_fetch` لجلب عناوين URL بشكل خفيف. في هذه المرحلة، يبقى `web_fetch`
محليًا بينما يمكن لكل من `web_search` و`x_search` استخدام xAI Responses داخليًا.

<Info>
  تُعد `web_search` أداة HTTP خفيفة، وليست أتمتة للمتصفح. بالنسبة إلى
  المواقع الثقيلة بالـ JS أو تسجيلات الدخول، استخدم [Web Browser](/ar/tools/browser). أما
  لجلب عنوان URL محدد، فاستخدم [Web Fetch](/ar/tools/web-fetch).
</Info>

## البدء السريع

<Steps>
  <Step title="اختر مزوّدًا">
    اختر مزوّدًا وأكمل أي إعداد مطلوب. بعض المزوّدين
    لا يحتاجون إلى مفتاح، بينما يستخدم آخرون مفاتيح API. راجع صفحات المزوّدين أدناه
    لمعرفة التفاصيل.
  </Step>
  <Step title="قم بالتكوين">
    ```bash
    openclaw configure --section web
    ```
    يؤدي هذا إلى تخزين المزوّد وأي بيانات اعتماد مطلوبة. ويمكنك أيضًا تعيين متغير env
    (على سبيل المثال `BRAVE_API_KEY`) وتخطي هذه الخطوة للمزوّدات
    المعتمدة على API.
  </Step>
  <Step title="استخدمه">
    يمكن للوكيل الآن استدعاء `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    بالنسبة إلى منشورات X، استخدم:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## اختيار مزوّد

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ar/tools/brave-search">
    نتائج منظَّمة مع مقتطفات. يدعم وضع `llm-context` ومرشحات البلد/اللغة. تتوفر طبقة مجانية.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ar/tools/duckduckgo-search">
    fallback من دون مفتاح. لا حاجة إلى مفتاح API. تكامل غير رسمي قائم على HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/ar/tools/exa-search">
    بحث عصبي + بالكلمات المفتاحية مع استخراج المحتوى (الإبرازات، والنص، والملخصات).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ar/tools/firecrawl">
    نتائج منظَّمة. يُفضّل إقرانه مع `firecrawl_search` و`firecrawl_scrape` للاستخراج العميق.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ar/tools/gemini-search">
    إجابات مُركبة بالذكاء الاصطناعي مع استشهادات عبر ربط Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/ar/tools/grok-search">
    إجابات مُركبة بالذكاء الاصطناعي مع استشهادات عبر ربط xAI بالويب.
  </Card>
  <Card title="Kimi" icon="moon" href="/ar/tools/kimi-search">
    إجابات مُركبة بالذكاء الاصطناعي مع استشهادات عبر بحث الويب من Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ar/tools/minimax-search">
    نتائج منظَّمة عبر واجهة API للبحث الخاصة بـ MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ar/tools/ollama-search">
    بحث من دون مفتاح عبر مضيف Ollama المكوَّن لديك. يتطلب `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/ar/tools/perplexity-search">
    نتائج منظَّمة مع عناصر تحكم في استخراج المحتوى وتصفية النطاقات.
  </Card>
  <Card title="SearXNG" icon="server" href="/ar/tools/searxng-search">
    بحث ميتا ذاتي الاستضافة. لا حاجة إلى مفتاح API. يجمع Google وBing وDuckDuckGo والمزيد.
  </Card>
  <Card title="Tavily" icon="globe" href="/ar/tools/tavily">
    نتائج منظَّمة مع عمق البحث، وتصفية الموضوع، و`tavily_extract` لاستخراج عناوين URL.
  </Card>
</CardGroup>

### مقارنة المزوّدين

| المزوّد                                  | نمط النتائج               | عوامل التصفية                                          | مفتاح API                                                                          |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/ar/tools/brave-search)              | مقتطفات منظَّمة        | البلد، اللغة، الوقت، وضع `llm-context`      | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/ar/tools/duckduckgo-search)    | مقتطفات منظَّمة        | --                                               | لا شيء (من دون مفتاح)                                                                  |
| [Exa](/ar/tools/exa-search)                  | منظَّمة + مستخرجة     | الوضع العصبي/الكلمات المفتاحية، التاريخ، استخراج المحتوى    | `EXA_API_KEY`                                                                    |
| [Firecrawl](/ar/tools/firecrawl)             | مقتطفات منظَّمة        | عبر أداة `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/ar/tools/gemini-search)            | مركبة بالذكاء الاصطناعي + استشهادات | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/ar/tools/grok-search)                | مركبة بالذكاء الاصطناعي + استشهادات | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/ar/tools/kimi-search)                | مركبة بالذكاء الاصطناعي + استشهادات | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/ar/tools/minimax-search)   | مقتطفات منظَّمة        | المنطقة (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/ar/tools/ollama-search) | مقتطفات منظَّمة        | --                                               | لا شيء افتراضيًا؛ يتطلب `ollama signin`، ويمكنه إعادة استخدام مصادقة Bearer الخاصة بمزوّد Ollama |
| [Perplexity](/ar/tools/perplexity-search)    | مقتطفات منظَّمة        | البلد، اللغة، الوقت، النطاقات، حدود المحتوى | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/ar/tools/searxng-search)          | مقتطفات منظَّمة        | الفئات، اللغة                             | لا شيء (ذاتي الاستضافة)                                                               |
| [Tavily](/ar/tools/tavily)                   | مقتطفات منظَّمة        | عبر أداة `tavily_search`                         | `TAVILY_API_KEY`                                                                 |

## الاكتشاف التلقائي

## بحث الويب الأصلي في Codex

يمكن للنماذج القادرة على Codex اختياريًا استخدام أداة `web_search` الأصلية في Responses الخاصة بالمزوّد بدلًا من الدالة `web_search` المُدارة من OpenClaw.

- قم بتكوينها ضمن `tools.web.search.openaiCodex`
- لا يتم تفعيلها إلا للنماذج القادرة على Codex (`openai-codex/*` أو المزوّدات التي تستخدم `api: "openai-codex-responses"`)
- تظل `web_search` المُدارة مطبقة على النماذج غير القادرة على Codex
- `mode: "cached"` هو الإعداد الافتراضي والموصى به
- يؤدي `tools.web.search.enabled: false` إلى تعطيل كل من البحث المُدار والبحث الأصلي

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

إذا تم تمكين بحث Codex الأصلي لكن النموذج الحالي غير قادر على Codex، فسيُبقي OpenClaw السلوك العادي لـ `web_search` المُدارة.

## إعداد بحث الويب

قوائم المزوّدين في الوثائق وتدفقات الإعداد مرتبة أبجديًا. أما الاكتشاف التلقائي فيحتفظ
بترتيب أولوية منفصل.

إذا لم يتم تعيين `provider`، فإن OpenClaw يتحقق من المزوّدين بهذا الترتيب ويستخدم
أول مزوّد جاهز:

المزوّدات المعتمدة على API أولًا:

1. **Brave** -- `BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey` (الترتيب 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` أو `plugins.entries.minimax.config.webSearch.apiKey` (الترتيب 15)
3. **Gemini** -- `GEMINI_API_KEY` أو `plugins.entries.google.config.webSearch.apiKey` (الترتيب 20)
4. **Grok** -- `XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey` (الترتيب 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` أو `plugins.entries.moonshot.config.webSearch.apiKey` (الترتيب 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` أو `plugins.entries.perplexity.config.webSearch.apiKey` (الترتيب 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey` (الترتيب 60)
8. **Exa** -- `EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey` (الترتيب 65)
9. **Tavily** -- `TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey` (الترتيب 70)

ثم fallbacks من دون مفتاح بعد ذلك:

10. **DuckDuckGo** -- fallback قائم على HTML ومن دون مفتاح ومن دون حساب أو مفتاح API (الترتيب 100)
11. **Ollama Web Search** -- fallback من دون مفتاح عبر مضيف Ollama المكوَّن لديك؛ يتطلب أن يكون Ollama قابلاً للوصول وأن تكون قد سجلت الدخول باستخدام `ollama signin`، ويمكنه إعادة استخدام مصادقة Bearer الخاصة بمزوّد Ollama إذا كان المضيف يحتاج إليها (الترتيب 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` (الترتيب 200)

إذا لم يتم اكتشاف أي مزوّد، فسيعود إلى Brave (وستحصل على
خطأ مفتاح مفقود يطلب منك تكوينه).

<Note>
  تدعم جميع حقول مفاتيح المزوّد كائنات SecretRef. ويتم حل SecretRefs
  الخاصة بالplugin ضمن `plugins.entries.<plugin>.config.webSearch.apiKey` من أجل
  مزوّدات Exa وFirecrawl وGemini وGrok وKimi وPerplexity وTavily المضمّنة
  سواء تم اختيار المزوّد صراحة عبر `tools.web.search.provider` أو
  تم اختياره من خلال الاكتشاف التلقائي. وفي وضع الاكتشاف التلقائي، لا يحل OpenClaw إلا
  مفتاح المزوّد المحدد -- وتبقى SecretRefs غير المحددة غير نشطة، بحيث يمكنك
  الاحتفاظ بعدة مزوّدين مكوّنين دون دفع تكلفة الحل للمزوّدات
  التي لا تستخدمها.
</Note>

## التكوين

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // الافتراضي: true
        provider: "brave", // أو احذفه للاكتشاف التلقائي
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

يوجد التكوين الخاص بالمزوّد (مفاتيح API، وعناوين URL الأساسية، والأوضاع) ضمن
`plugins.entries.<plugin>.config.webSearch.*`. راجع صفحات المزوّدين للحصول على
أمثلة.

يكون اختيار مزوّد fallback الخاص بـ `web_fetch` منفصلًا:

- اختره باستخدام `tools.web.fetch.provider`
- أو احذف ذلك الحقل ودع OpenClaw يكتشف تلقائيًا أول مزوّد web-fetch
  جاهز من بيانات الاعتماد المتاحة
- اليوم، مزوّد web-fetch المضمّن هو Firecrawl، ويُكوَّن ضمن
  `plugins.entries.firecrawl.config.webFetch.*`

عندما تختار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`، يمكن لـ OpenClaw أيضًا أن يسألك عن:

- منطقة Moonshot API (`https://api.moonshot.ai/v1` أو `https://api.moonshot.cn/v1`)
- نموذج Kimi الافتراضي لبحث الويب (الافتراضي `kimi-k2.6`)

بالنسبة إلى `x_search`، قم بتكوين `plugins.entries.xai.config.xSearch.*`. وهو يستخدم
نفس fallback ‏`XAI_API_KEY` مثل بحث الويب Grok.
يتم ترحيل التكوين القديم `tools.web.x_search.*` تلقائيًا بواسطة `openclaw doctor --fix`.
وعندما تختار Grok أثناء `openclaw onboard` أو `openclaw configure --section web`،
يمكن لـ OpenClaw أيضًا أن يعرض إعداد `x_search` اختياريًا باستخدام المفتاح نفسه.
وهذه خطوة متابعة منفصلة داخل مسار Grok، وليست خيارًا منفصلًا على المستوى الأعلى
لمزوّد بحث الويب. وإذا اخترت مزوّدًا آخر، فلن يعرض OpenClaw
مطالبة `x_search`.

### تخزين مفاتيح API

<Tabs>
  <Tab title="ملف التكوين">
    شغّل `openclaw configure --section web` أو عيّن المفتاح مباشرة:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="متغير البيئة">
    عيّن متغير env الخاص بالمزوّد في بيئة عملية Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    بالنسبة إلى تثبيت gateway، ضعه في `~/.openclaw/.env`.
    راجع [متغيرات env](/ar/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## معلمات الأداة

| المعلمة             | الوصف                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | استعلام البحث (مطلوب)                               |
| `count`               | النتائج المطلوب إرجاعها (1-10، الافتراضي: 5)                  |
| `country`             | رمز بلد ISO مكوّن من حرفين (مثل `"US"` و`"DE"`)           |
| `language`            | رمز لغة ISO 639-1 (مثل `"en"` و`"de"`)             |
| `search_lang`         | رمز لغة البحث (Brave فقط)                     |
| `freshness`           | عامل تصفية الوقت: `day` أو `week` أو `month` أو `year`        |
| `date_after`          | النتائج بعد هذا التاريخ (YYYY-MM-DD)                  |
| `date_before`         | النتائج قبل هذا التاريخ (YYYY-MM-DD)                 |
| `ui_lang`             | رمز لغة واجهة المستخدم (Brave فقط)                         |
| `domain_filter`       | مصفوفة قائمة سماح/منع للنطاقات (Perplexity فقط)     |
| `max_tokens`          | الميزانية الإجمالية للمحتوى، الافتراضي 25000 (Perplexity فقط) |
| `max_tokens_per_page` | حد الرموز لكل صفحة، الافتراضي 2048 (Perplexity فقط)  |

<Warning>
  لا تعمل جميع المعلمات مع جميع المزوّدين. يرفض وضع Brave ‏`llm-context`
  القيم `ui_lang` و`freshness` و`date_after` و`date_before`.
  تعيد Gemini وGrok وKimi إجابة مركبة واحدة مع استشهادات. وهي
  تقبل `count` من أجل توافق الأداة المشتركة، لكنه لا يغيّر
  شكل الإجابة المرتكزة.
  يتصرف Perplexity بالطريقة نفسها عندما تستخدم مسار التوافق
  الخاص بـ Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` أو `OPENROUTER_API_KEY`).
  يقبل SearXNG عناوين `http://` فقط للمضيفات الموثوقة ضمن الشبكة الخاصة أو loopback؛
  ويجب أن تستخدم نقاط نهاية SearXNG العامة `https://`.
  لا يدعم Firecrawl وTavily سوى `query` و`count` عبر `web_search`
  -- استخدم أدواتهما المخصصة للخيارات المتقدمة.
</Warning>

## `x_search`

تستعلم `x_search` عن منشورات X (المعروف سابقًا باسم Twitter) باستخدام xAI وتعيد
إجابات مركبة بالذكاء الاصطناعي مع استشهادات. وهي تقبل استعلامات بلغة طبيعية
وعوامل تصفية منظمة اختيارية. ولا يفعّل OpenClaw أداة `x_search` المضمّنة في xAI
إلا على الطلب الذي يخدم استدعاء هذه الأداة.

<Note>
  توثّق xAI أن `x_search` يدعم البحث بالكلمات المفتاحية، والبحث الدلالي، والبحث عن المستخدم،
  وجلب الخيوط. وبالنسبة إلى إحصاءات التفاعل لكل منشور مثل إعادة النشر،
  والردود، والإشارات المرجعية، أو المشاهدات، ففضّل عملية lookup موجهة لعنوان URL
  الدقيق للمنشور أو معرّف الحالة. وقد تعثر عمليات البحث الواسعة بالكلمات المفتاحية على المنشور الصحيح لكنها تعيد
  بيانات وصفية أقل اكتمالًا لكل منشور. والنمط الجيد هو: حدّد المنشور أولًا، ثم
  شغّل استعلام `x_search` ثانيًا يركّز على ذلك المنشور المحدد.
</Note>

### تكوين `x_search`

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // اختياري إذا كان XAI_API_KEY مضبوطًا
          },
        },
      },
    },
  },
}
```

### معلمات `x_search`

| المعلمة                    | الوصف                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | استعلام البحث (مطلوب)                                |
| `allowed_x_handles`          | قصر النتائج على handles محددة في X                 |
| `excluded_x_handles`         | استبعاد handles محددة في X                             |
| `from_date`                  | تضمين المنشورات في هذا التاريخ أو بعده فقط (YYYY-MM-DD)  |
| `to_date`                    | تضمين المنشورات في هذا التاريخ أو قبله فقط (YYYY-MM-DD) |
| `enable_image_understanding` | السماح لـ xAI بفحص الصور المرفقة بالمنشورات المطابقة      |
| `enable_video_understanding` | السماح لـ xAI بفحص مقاطع الفيديو المرفقة بالمنشورات المطابقة      |

### مثال على `x_search`

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// إحصاءات كل منشور: استخدم عنوان URL الدقيق للحالة أو معرّف الحالة متى أمكن
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## أمثلة

```javascript
// بحث أساسي
await web_search({ query: "OpenClaw plugin SDK" });

// بحث خاص بألمانيا
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// نتائج حديثة (الأسبوع الماضي)
await web_search({ query: "AI developments", freshness: "week" });

// نطاق تاريخ
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// تصفية النطاقات (Perplexity فقط)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## ملفات تعريف الأدوات

إذا كنت تستخدم ملفات تعريف الأدوات أو قوائم السماح، فأضف `web_search` أو `x_search` أو `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // أو: allow: ["group:web"]  (يتضمن web_search وx_search وweb_fetch)
  },
}
```

## ذو صلة

- [Web Fetch](/ar/tools/web-fetch) -- اجلب عنوان URL واستخرج محتوى مقروءًا
- [Web Browser](/ar/tools/browser) -- أتمتة متصفح كاملة للمواقع الثقيلة بالـ JS
- [Grok Search](/ar/tools/grok-search) -- ‏Grok كمزوّد `web_search`
- [Ollama Web Search](/ar/tools/ollama-search) -- بحث ويب من دون مفتاح عبر مضيف Ollama الخاص بك
