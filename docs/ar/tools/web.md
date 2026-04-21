---
read_when:
    - أنت تريد تمكين `web_search` أو إعداده
    - أنت تريد تمكين `x_search` أو إعداده
    - أنت بحاجة إلى اختيار موفّر بحث
    - أنت تريد فهم الاكتشاف التلقائي والرجوع الاحتياطي للمزوّد
sidebarTitle: Web Search
summary: '`web_search` و`x_search` و`web_fetch` -- ابحث في الويب، أو ابحث في منشورات X، أو اجلب محتوى الصفحة'
title: بحث الويب
x-i18n:
    generated_at: "2026-04-21T07:27:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e88a891ce28a5fe1baf4b9ce8565c59ba2d2695c63d77af232edd7f3fd2cd8a
    source_path: tools/web.md
    workflow: 15
---

# بحث الويب

تبحث أداة `web_search` في الويب باستخدام الموفّر الذي قمت بإعداده
وتعيد النتائج. وتُخزَّن النتائج مؤقتًا حسب الاستعلام لمدة 15 دقيقة (قابلة للضبط).

يتضمن OpenClaw أيضًا `x_search` لمنشورات X (سابقًا Twitter) و
`web_fetch` لجلب عناوين URL بشكل خفيف. وفي هذه المرحلة، يظل `web_fetch`
محليًا بينما يمكن لكل من `web_search` و`x_search` استخدام xAI Responses في الخلفية.

<Info>
  إن `web_search` أداة HTTP خفيفة، وليست أتمتة متصفح. وبالنسبة إلى
  المواقع الثقيلة المعتمدة على JS أو عمليات تسجيل الدخول، استخدم [Web Browser](/ar/tools/browser). أما
  لجلب عنوان URL محدد، فاستخدم [Web Fetch](/ar/tools/web-fetch).
</Info>

## البدء السريع

<Steps>
  <Step title="اختر موفّرًا">
    اختر موفّرًا وأكمل أي إعداد مطلوب. فبعض الموفّرين
    لا يحتاجون إلى مفاتيح، بينما يستخدم آخرون مفاتيح API. راجع صفحات الموفّرين أدناه لمعرفة
    التفاصيل.
  </Step>
  <Step title="الإعداد">
    ```bash
    openclaw configure --section web
    ```
    يخزن هذا الموفّر وأي بيانات اعتماد مطلوبة. ويمكنك أيضًا ضبط متغير بيئة
    (مثل `BRAVE_API_KEY`) وتخطي هذه الخطوة للمزوّدين المعتمدين على API.
  </Step>
  <Step title="استخدمه">
    يمكن للعامل الآن استدعاء `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    وبالنسبة إلى منشورات X، استخدم:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## اختيار موفّر

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ar/tools/brave-search">
    نتائج منظَّمة مع مقتطفات. يدعم وضع `llm-context` ومرشحات البلد/اللغة. تتوفر فئة مجانية.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ar/tools/duckduckgo-search">
    خيار رجوعي لا يحتاج إلى مفتاح. لا حاجة إلى مفتاح API. تكامل غير رسمي قائم على HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/ar/tools/exa-search">
    بحث عصبي + بالكلمات المفتاحية مع استخراج المحتوى (إبرازات، ونص، وملخصات).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ar/tools/firecrawl">
    نتائج منظَّمة. يُفضَّل إقرانه مع `firecrawl_search` و`firecrawl_scrape` للاستخراج العميق.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ar/tools/gemini-search">
    إجابات مُولَّدة بالذكاء الاصطناعي مع استشهادات عبر الإسناد من Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/ar/tools/grok-search">
    إجابات مُولَّدة بالذكاء الاصطناعي مع استشهادات عبر الإسناد من الويب في xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/ar/tools/kimi-search">
    إجابات مُولَّدة بالذكاء الاصطناعي مع استشهادات عبر بحث الويب في Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ar/tools/minimax-search">
    نتائج منظَّمة عبر API البحث في MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ar/tools/ollama-search">
    بحث لا يحتاج إلى مفتاح عبر مضيف Ollama المكوَّن لديك. يتطلب `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/ar/tools/perplexity-search">
    نتائج منظَّمة مع عناصر تحكم لاستخراج المحتوى وتصفية المجالات.
  </Card>
  <Card title="SearXNG" icon="server" href="/ar/tools/searxng-search">
    بحث فائق مستضاف ذاتيًا. لا حاجة إلى مفتاح API. يجمع Google وBing وDuckDuckGo وغير ذلك.
  </Card>
  <Card title="Tavily" icon="globe" href="/ar/tools/tavily">
    نتائج منظَّمة مع عمق البحث، وتصفية الموضوعات، و`tavily_extract` لاستخراج عناوين URL.
  </Card>
</CardGroup>

### مقارنة الموفّرين

| الموفّر                                   | نمط النتائج                 | المرشحات                                         | مفتاح API                                                                       |
| ----------------------------------------- | --------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/ar/tools/brave-search)              | مقتطفات منظَّمة             | البلد، واللغة، والوقت، ووضع `llm-context`        | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/ar/tools/duckduckgo-search)    | مقتطفات منظَّمة             | --                                               | لا شيء (من دون مفتاح)                                                            |
| [Exa](/ar/tools/exa-search)                  | منظَّم + مستخرج             | وضع عصبي/كلمات مفتاحية، والتاريخ، واستخراج المحتوى | `EXA_API_KEY`                                                                    |
| [Firecrawl](/ar/tools/firecrawl)             | مقتطفات منظَّمة             | عبر أداة `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/ar/tools/gemini-search)            | مُولَّد بالذكاء الاصطناعي + استشهادات | --                                      | `GEMINI_API_KEY`                                                                 |
| [Grok](/ar/tools/grok-search)                | مُولَّد بالذكاء الاصطناعي + استشهادات | --                                      | `XAI_API_KEY`                                                                    |
| [Kimi](/ar/tools/kimi-search)                | مُولَّد بالذكاء الاصطناعي + استشهادات | --                                      | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/ar/tools/minimax-search)   | مقتطفات منظَّمة             | المنطقة (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/ar/tools/ollama-search) | مقتطفات منظَّمة             | --                                               | لا شيء افتراضيًا؛ يتطلب `ollama signin` ويمكنه إعادة استخدام مصادقة bearer الخاصة بموفّر Ollama |
| [Perplexity](/ar/tools/perplexity-search)    | مقتطفات منظَّمة             | البلد، واللغة، والوقت، والمجالات، وحدود المحتوى   | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/ar/tools/searxng-search)          | مقتطفات منظَّمة             | الفئات، واللغة                                   | لا شيء (مستضاف ذاتيًا)                                                           |
| [Tavily](/ar/tools/tavily)                   | مقتطفات منظَّمة             | عبر أداة `tavily_search`                         | `TAVILY_API_KEY`                                                                 |

## الاكتشاف التلقائي

## بحث الويب الأصلي في Codex

يمكن للنماذج القادرة على Codex أن تستخدم اختياريًا أداة Responses الأصلية `web_search` الخاصة بالموفّر بدلًا من الدالة `web_search` المُدارة في OpenClaw.

- قم بإعدادها تحت `tools.web.search.openaiCodex`
- لا يتم تفعيلها إلا للنماذج القادرة على Codex (`openai-codex/*` أو الموفّرين الذين يستخدمون `api: "openai-codex-responses"`)
- تظل `web_search` المُدارة مطبقة على النماذج غير القادرة على Codex
- إن `mode: "cached"` هو الإعداد الافتراضي والمُوصى به
- يعطّل `tools.web.search.enabled: false` كلًا من البحث المُدار والبحث الأصلي

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

إذا كان بحث Codex الأصلي مفعّلًا لكن النموذج الحالي غير قادر على Codex، فسيُبقي OpenClaw على سلوك `web_search` المُدار العادي.

## إعداد بحث الويب

تكون قوائم الموفّرين في الوثائق وتدفقات الإعداد مرتبة أبجديًا. أما الاكتشاف التلقائي فيحتفظ
بترتيب أولوية منفصل.

إذا لم يتم ضبط `provider`، فسيتحقق OpenClaw من الموفّرين بهذا الترتيب ويستخدم
أول موفّر جاهز:

الموفّرون المعتمدون على API أولًا:

1. **Brave** -- `BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey` (الترتيب 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` أو `plugins.entries.minimax.config.webSearch.apiKey` (الترتيب 15)
3. **Gemini** -- `GEMINI_API_KEY` أو `plugins.entries.google.config.webSearch.apiKey` (الترتيب 20)
4. **Grok** -- `XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey` (الترتيب 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` أو `plugins.entries.moonshot.config.webSearch.apiKey` (الترتيب 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` أو `plugins.entries.perplexity.config.webSearch.apiKey` (الترتيب 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey` (الترتيب 60)
8. **Exa** -- `EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey` (الترتيب 65)
9. **Tavily** -- `TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey` (الترتيب 70)

الخيارات الرجوعية التي لا تحتاج إلى مفتاح بعد ذلك:

10. **DuckDuckGo** -- خيار HTML رجوعي من دون مفتاح ومن دون حساب أو مفتاح API (الترتيب 100)
11. **Ollama Web Search** -- خيار رجوعي من دون مفتاح عبر مضيف Ollama المكوَّن لديك؛ ويتطلب أن يكون Ollama قابلًا للوصول وأن يكون قد تم تسجيل الدخول إليه عبر `ollama signin`، ويمكنه إعادة استخدام مصادقة bearer الخاصة بموفّر Ollama إذا احتاجها المضيف (الترتيب 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` (الترتيب 200)

إذا لم يتم اكتشاف أي موفّر، فسيعود إلى Brave (وستحصل على خطأ يفيد بغياب المفتاح
ويطلب منك إعداد واحد).

<Note>
  تدعم جميع حقول مفاتيح الموفّرين كائنات SecretRef. وفي وضع الاكتشاف التلقائي،
  لا يحل OpenClaw إلا مفتاح الموفّر المحدد — وتظل SecretRefs
  غير المحددة غير نشطة.
</Note>

## الإعدادات

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

توجد الإعدادات الخاصة بكل موفّر (مفاتيح API، وعناوين URL الأساسية، والأوضاع) تحت
`plugins.entries.<plugin>.config.webSearch.*`. راجع صفحات الموفّرين للحصول على
أمثلة.

يكون اختيار موفّر الرجوع الاحتياطي لـ `web_fetch` منفصلًا:

- اختره عبر `tools.web.fetch.provider`
- أو احذف هذا الحقل ودع OpenClaw يكتشف تلقائيًا أول موفّر `web-fetch`
  جاهز من بيانات الاعتماد المتاحة
- واليوم يكون موفّر `web-fetch` المضمّن هو Firecrawl، ويُضبط تحت
  `plugins.entries.firecrawl.config.webFetch.*`

عندما تختار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`، يمكن لـ OpenClaw أيضًا أن يطلب:

- منطقة Moonshot API ‏(`https://api.moonshot.ai/v1` أو `https://api.moonshot.cn/v1`)
- نموذج بحث الويب الافتراضي لـ Kimi (الافتراضي هو `kimi-k2.6`)

بالنسبة إلى `x_search`، قم بإعداد `plugins.entries.xai.config.xSearch.*`. فهو يستخدم
الخيار الرجوعي نفسه `XAI_API_KEY` مثل بحث Grok على الويب.
ويتم ترحيل إعداد `tools.web.x_search.*` القديم تلقائيًا بواسطة `openclaw doctor --fix`.
وعندما تختار Grok أثناء `openclaw onboard` أو `openclaw configure --section web`،
يمكن لـ OpenClaw أيضًا أن يعرض إعداد `x_search` الاختياري باستخدام المفتاح نفسه.
وهذه خطوة متابعة منفصلة داخل مسار Grok، وليست خيارًا علويًا منفصلًا
لموفّر بحث الويب. وإذا اخترت موفّرًا آخر، فلن يعرض OpenClaw
موجّه `x_search`.

### تخزين مفاتيح API

<Tabs>
  <Tab title="ملف الإعدادات">
    شغّل `openclaw configure --section web` أو اضبط المفتاح مباشرة:

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
    اضبط متغير البيئة الخاص بالموفّر في بيئة عملية Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    وبالنسبة إلى تثبيت gateway، ضعه في `~/.openclaw/.env`.
    راجع [متغيرات البيئة](/ar/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## معاملات الأداة

| المعامل               | الوصف                                                       |
| --------------------- | ----------------------------------------------------------- |
| `query`               | استعلام البحث (مطلوب)                                       |
| `count`               | عدد النتائج المطلوب إرجاعها (1-10، الافتراضي: 5)           |
| `country`             | رمز البلد ISO المكوّن من حرفين (مثل `"US"`، `"DE"`)        |
| `language`            | رمز اللغة ISO 639-1 (مثل `"en"`، `"de"`)                    |
| `search_lang`         | رمز لغة البحث (Brave فقط)                                   |
| `freshness`           | مرشح الوقت: `day` أو `week` أو `month` أو `year`            |
| `date_after`          | النتائج بعد هذا التاريخ (YYYY-MM-DD)                        |
| `date_before`         | النتائج قبل هذا التاريخ (YYYY-MM-DD)                        |
| `ui_lang`             | رمز لغة واجهة المستخدم (Brave فقط)                          |
| `domain_filter`       | مصفوفة قائمة سماح/منع للمجالات (Perplexity فقط)             |
| `max_tokens`          | ميزانية المحتوى الإجمالية، الافتراضي 25000 (Perplexity فقط) |
| `max_tokens_per_page` | حد الرموز لكل صفحة، الافتراضي 2048 (Perplexity فقط)         |

<Warning>
  لا تعمل جميع المعاملات مع جميع الموفّرين. إذ إن وضع `llm-context` في Brave
  يرفض `ui_lang`، و`freshness`، و`date_after`، و`date_before`.
  ويعيد Gemini وGrok وKimi إجابة مُولَّدة واحدة مع استشهادات. وهم
  يقبلون `count` من أجل التوافق مع الأداة المشتركة، لكنه لا يغيّر
  شكل الإجابة المؤسَّسة.
  ويتصرف Perplexity بالطريقة نفسها عندما تستخدم مسار
  التوافق Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` أو `OPENROUTER_API_KEY`).
  ويقبل SearXNG عناوين `http://` فقط للمضيفات الموثوقة على الشبكات الخاصة أو loopback؛
  أما نقاط نهاية SearXNG العامة فيجب أن تستخدم `https://`.
  ولا يدعم Firecrawl وTavily سوى `query` و`count` عبر `web_search`
  -- استخدم أدواتهما المخصصة للخيارات المتقدمة.
</Warning>

## x_search

تستعلم `x_search` عن منشورات X (سابقًا Twitter) باستخدام xAI وتعيد
إجابات مُولَّدة بالذكاء الاصطناعي مع استشهادات. وهي تقبل استعلامات باللغة الطبيعية و
مرشحات منظمة اختيارية. ولا يفعّل OpenClaw أداة xAI المضمّنة `x_search`
إلا على الطلب الذي يخدم استدعاء هذه الأداة.

<Note>
  توثّق xAI الأداة `x_search` على أنها تدعم البحث بالكلمات المفتاحية، والبحث الدلالي، وبحث
  المستخدم، وجلب السلاسل. أما بالنسبة إلى إحصاءات التفاعل لكل منشور مثل إعادة النشر،
  والردود، والإشارات المرجعية، أو المشاهدات، ففضّل تنفيذ عملية بحث مستهدفة لعنوان URL
  أو معرّف الحالة الخاص بالمنشور نفسه. فقد تعثر عمليات البحث الواسعة بالكلمات المفتاحية على المنشور الصحيح
  لكنها تعيد بيانات وصفية أقل اكتمالًا لكل منشور. والنمط الجيد هو:
  حدّد موقع المنشور أولًا، ثم نفّذ استعلام `x_search` ثانيًا يركّز على ذلك المنشور نفسه.
</Note>

### إعداد x_search

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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### معاملات x_search

| المعامل                     | الوصف                                                      |
| --------------------------- | ---------------------------------------------------------- |
| `query`                     | استعلام البحث (مطلوب)                                      |
| `allowed_x_handles`         | قصر النتائج على مقابض X محددة                              |
| `excluded_x_handles`        | استبعاد مقابض X محددة                                      |
| `from_date`                 | تضمين المنشورات الواقعة في هذا التاريخ أو بعده فقط (YYYY-MM-DD) |
| `to_date`                   | تضمين المنشورات الواقعة في هذا التاريخ أو قبله فقط (YYYY-MM-DD) |
| `enable_image_understanding` | السماح لـ xAI بفحص الصور المرفقة بالمنشورات المطابقة       |
| `enable_video_understanding` | السماح لـ xAI بفحص مقاطع الفيديو المرفقة بالمنشورات المطابقة |

### مثال على x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## أمثلة

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
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
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## ذو صلة

- [Web Fetch](/ar/tools/web-fetch) -- اجلب عنوان URL واستخرج المحتوى المقروء
- [Web Browser](/ar/tools/browser) -- أتمتة متصفح كاملة للمواقع الثقيلة المعتمدة على JS
- [بحث Grok](/ar/tools/grok-search) -- Grok بوصفه موفّر `web_search`
- [Ollama Web Search](/ar/tools/ollama-search) -- بحث ويب من دون مفتاح عبر مضيف Ollama لديك
