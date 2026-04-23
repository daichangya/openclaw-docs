---
read_when:
    - تريد تمكين `web_search` أو إعداده
    - تريد تمكين `x_search` أو إعداده
    - تحتاج إلى اختيار مزوّد بحث
    - تريد فهم الاكتشاف التلقائي واحتياط المزوّدين
sidebarTitle: Web Search
summary: '`web_search`، و`x_search`، و`web_fetch` -- البحث في الويب، أو البحث في منشورات X، أو جلب محتوى الصفحات'
title: البحث على الويب
x-i18n:
    generated_at: "2026-04-23T07:34:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e568670e1e15f195dbac1a249723a2ad873d6c49217575959b8eea2cb14ef75
    source_path: tools/web.md
    workflow: 15
---

# البحث على الويب

تبحث أداة `web_search` في الويب باستخدام المزوّد المضبوط لديك
وتعيد النتائج. وتُخزَّن النتائج مؤقتًا حسب الاستعلام لمدة 15 دقيقة (قابلة للضبط).

يتضمن OpenClaw أيضًا `x_search` لمنشورات X ‏(المعروف سابقًا باسم Twitter) و
`web_fetch` لجلب URL بشكل خفيف. وفي هذه المرحلة، يبقى `web_fetch`
محليًا بينما يستطيع `web_search` و`x_search` استخدام xAI Responses داخليًا.

<Info>
  تمثل `web_search` أداة HTTP خفيفة، وليست أتمتة متصفح. وبالنسبة إلى
  المواقع المعتمدة بكثرة على JS أو التي تتطلب تسجيل دخول، فاستخدم [متصفح الويب](/ar/tools/browser). ومن
  أجل جلب URL محدد، استخدم [Web Fetch](/ar/tools/web-fetch).
</Info>

## البدء السريع

<Steps>
  <Step title="اختر مزوّدًا">
    اختر مزوّدًا وأكمل أي إعداد مطلوب. بعض المزوّدات
    لا تحتاج إلى مفتاح، بينما يستخدم بعضها الآخر مفاتيح API. راجع صفحات
    المزوّدين أدناه للتفاصيل.
  </Step>
  <Step title="الإعداد">
    ```bash
    openclaw configure --section web
    ```
    يخزّن هذا المزوّد وأي بيانات اعتماد لازمة. ويمكنك أيضًا ضبط متغير env
    (مثل `BRAVE_API_KEY`) وتخطي هذه الخطوة بالنسبة إلى
    المزوّدين المدعومين بـ API.
  </Step>
  <Step title="استخدمه">
    يستطيع الوكيل الآن استدعاء `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    وبالنسبة إلى منشورات X، استخدم:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## اختيار مزوّد

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/ar/tools/brave-search">
    نتائج منظّمة مع مقتطفات. تدعم وضع `llm-context` وعوامل تصفية البلد/اللغة. تتوفر فئة مجانية.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/ar/tools/duckduckgo-search">
    احتياط لا يحتاج إلى مفتاح. لا حاجة إلى مفتاح API. تكامل غير رسمي قائم على HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/ar/tools/exa-search">
    بحث عصبي + بحث بالكلمات المفتاحية مع استخراج المحتوى (إبرازات، نص، ملخصات).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/ar/tools/firecrawl">
    نتائج منظّمة. يُفضّل إقرانه مع `firecrawl_search` و`firecrawl_scrape` من أجل استخراج عميق.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/ar/tools/gemini-search">
    إجابات مُركّبة بالذكاء الاصطناعي مع استشهادات عبر Google Search grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/ar/tools/grok-search">
    إجابات مُركّبة بالذكاء الاصطناعي مع استشهادات عبر xAI web grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/ar/tools/kimi-search">
    إجابات مُركّبة بالذكاء الاصطناعي مع استشهادات عبر بحث Moonshot على الويب.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/ar/tools/minimax-search">
    نتائج منظّمة عبر API البحث الخاصة بـ MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/ar/tools/ollama-search">
    بحث لا يحتاج إلى مفتاح عبر مضيف Ollama المضبوط لديك. ويتطلب `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/ar/tools/perplexity-search">
    نتائج منظّمة مع عناصر تحكم لاستخراج المحتوى وتصفية النطاقات.
  </Card>
  <Card title="SearXNG" icon="server" href="/ar/tools/searxng-search">
    بحث ميتا ذاتي الاستضافة. لا يحتاج إلى مفتاح API. ويجمع Google وBing وDuckDuckGo وغيرها.
  </Card>
  <Card title="Tavily" icon="globe" href="/ar/tools/tavily">
    نتائج منظّمة مع عمق البحث، وتصفية الموضوع، و`tavily_extract` لاستخراج URL.
  </Card>
</CardGroup>

### مقارنة بين المزوّدين

| المزوّد                                      | نمط النتائج                | عوامل التصفية                                     | مفتاح API                                                                        |
| -------------------------------------------- | -------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| [Brave](/ar/tools/brave-search)                 | مقتطفات منظّمة            | البلد، اللغة، الوقت، وضع `llm-context`           | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/ar/tools/duckduckgo-search)       | مقتطفات منظّمة            | --                                                | لا شيء (من دون مفتاح)                                                            |
| [Exa](/ar/tools/exa-search)                     | منظّمة + مستخرجة          | وضع عصبي/كلمات مفتاحية، التاريخ، استخراج المحتوى | `EXA_API_KEY`                                                                    |
| [Firecrawl](/ar/tools/firecrawl)                | مقتطفات منظّمة            | عبر الأداة `firecrawl_search`                     | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/ar/tools/gemini-search)               | مُركّبة بالذكاء الاصطناعي + استشهادات | --                                      | `GEMINI_API_KEY`                                                                 |
| [Grok](/ar/tools/grok-search)                   | مُركّبة بالذكاء الاصطناعي + استشهادات | --                                      | `XAI_API_KEY`                                                                    |
| [Kimi](/ar/tools/kimi-search)                   | مُركّبة بالذكاء الاصطناعي + استشهادات | --                                      | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/ar/tools/minimax-search)      | مقتطفات منظّمة            | المنطقة (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/ar/tools/ollama-search)    | مقتطفات منظّمة            | --                                                | لا شيء افتراضيًا؛ يتطلب `ollama signin`، ويمكنه إعادة استخدام bearer auth الخاصة بمزوّد Ollama |
| [Perplexity](/ar/tools/perplexity-search)       | مقتطفات منظّمة            | البلد، اللغة، الوقت، النطاقات، حدود المحتوى      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/ar/tools/searxng-search)             | مقتطفات منظّمة            | الفئات، اللغة                                     | لا شيء (استضافة ذاتية)                                                           |
| [Tavily](/ar/tools/tavily)                      | مقتطفات منظّمة            | عبر الأداة `tavily_search`                        | `TAVILY_API_KEY`                                                                 |

## الاكتشاف التلقائي

## البحث الأصلي على الويب في OpenAI

تستخدم نماذج OpenAI Responses المباشرة أداة `web_search` المستضافة من OpenAI تلقائيًا عندما يكون البحث على الويب في OpenClaw مفعّلًا ولا يوجد مزوّد مُدار مثبت صراحةً. ويمثل هذا سلوكًا مملوكًا للمزوّد في Plugin OpenAI المضمّنة، ولا ينطبق إلا على حركة API الأصلية لـ OpenAI، لا على عناوين base URL الخاصة بالوكلاء المتوافقة مع OpenAI أو مسارات Azure. اضبط `tools.web.search.provider` على مزوّد آخر مثل `brave` للإبقاء على أداة `web_search` المُدارة مع نماذج OpenAI، أو اضبط `tools.web.search.enabled: false` لتعطيل كلٍّ من البحث المُدار والبحث الأصلي لـ OpenAI.

## البحث الأصلي على الويب في Codex

يمكن لنماذج Codex القادرة اختياريًا استخدام أداة `web_search` الأصلية في Responses الخاصة بالمزوّد بدلًا من وظيفة `web_search` المُدارة في OpenClaw.

- اضبطها تحت `tools.web.search.openaiCodex`
- لا تُفعَّل إلا للنماذج القادرة على Codex ‏(`openai-codex/*` أو المزوّدين الذين يستخدمون `api: "openai-codex-responses"`)
- لا تزال `web_search` المُدارة تنطبق على النماذج غير التابعة لـ Codex
- يمثل `mode: "cached"` الإعداد الافتراضي والموصى به
- تؤدي `tools.web.search.enabled: false` إلى تعطيل كلٍّ من البحث المُدار والبحث الأصلي

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

إذا كان البحث الأصلي في Codex مفعّلًا لكن النموذج الحالي غير قادر على Codex، فسيبقي OpenClaw سلوك `web_search` المُدار العادي.

## إعداد البحث على الويب

تكون قوائم المزوّدين في المستندات وتدفّقات الإعداد مرتبة أبجديًا. أما الاكتشاف التلقائي فيحافظ على
ترتيب أولوية منفصل.

إذا لم يُضبط `provider`، فإن OpenClaw يتحقق من المزوّدين بهذا الترتيب ويستخدم
أول مزوّد جاهز:

المزوّدون المدعومون بـ API أولًا:

1. **Brave** -- ‏`BRAVE_API_KEY` أو `plugins.entries.brave.config.webSearch.apiKey` ‏(الترتيب 10)
2. **MiniMax Search** -- ‏`MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` أو `plugins.entries.minimax.config.webSearch.apiKey` ‏(الترتيب 15)
3. **Gemini** -- ‏`GEMINI_API_KEY` أو `plugins.entries.google.config.webSearch.apiKey` ‏(الترتيب 20)
4. **Grok** -- ‏`XAI_API_KEY` أو `plugins.entries.xai.config.webSearch.apiKey` ‏(الترتيب 30)
5. **Kimi** -- ‏`KIMI_API_KEY` / `MOONSHOT_API_KEY` أو `plugins.entries.moonshot.config.webSearch.apiKey` ‏(الترتيب 40)
6. **Perplexity** -- ‏`PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` أو `plugins.entries.perplexity.config.webSearch.apiKey` ‏(الترتيب 50)
7. **Firecrawl** -- ‏`FIRECRAWL_API_KEY` أو `plugins.entries.firecrawl.config.webSearch.apiKey` ‏(الترتيب 60)
8. **Exa** -- ‏`EXA_API_KEY` أو `plugins.entries.exa.config.webSearch.apiKey` ‏(الترتيب 65)
9. **Tavily** -- ‏`TAVILY_API_KEY` أو `plugins.entries.tavily.config.webSearch.apiKey` ‏(الترتيب 70)

احتياطات لا تحتاج إلى مفتاح بعد ذلك:

10. **DuckDuckGo** -- احتياط HTML لا يحتاج إلى مفتاح ولا حساب أو مفتاح API ‏(الترتيب 100)
11. **Ollama Web Search** -- احتياط لا يحتاج إلى مفتاح عبر مضيف Ollama المضبوط لديك؛ ويتطلب أن تكون Ollama قابلة للوصول وأن تكون قد سجلت الدخول عبر `ollama signin`، ويمكنه إعادة استخدام bearer auth الخاصة بمزوّد Ollama إذا احتاج المضيف إلى ذلك ‏(الترتيب 110)
12. **SearXNG** -- ‏`SEARXNG_BASE_URL` أو `plugins.entries.searxng.config.webSearch.baseUrl` ‏(الترتيب 200)

إذا لم يُكتشف أي مزوّد، فسيعود إلى Brave (وستحصل على خطأ
غياب المفتاح يطلب منك ضبط واحد).

<Note>
  تدعم جميع حقول مفاتيح المزوّدات كائنات SecretRef. ويجري حل
  SecretRef الخاصة بالـ Plugins تحت `plugins.entries.<plugin>.config.webSearch.apiKey`
  بالنسبة إلى المزوّدين المضمّنين Exa وFirecrawl وGemini وGrok وKimi وPerplexity وTavily
  سواء اختير المزوّد صراحةً عبر `tools.web.search.provider` أو
  تم اختياره من خلال الاكتشاف التلقائي. وفي وضع الاكتشاف التلقائي، لا يحل OpenClaw إلا
  مفتاح المزوّد المحدد — وتظل SecretRef الخاصة بالمزوّدات غير المحددة غير نشطة، بحيث يمكنك
  الاحتفاظ بعدة مزوّدات مضبوطة من دون دفع تكلفة الحل للمزوّدات
  التي لا تستخدمها.
</Note>

## الإعداد

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // الافتراضي: true
        provider: "brave", // أو احذف هذا للحقل من أجل الاكتشاف التلقائي
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

توجد الإعدادات الخاصة بالمزوّد (مفاتيح API، وعناوين base URL، والأوضاع) تحت
`plugins.entries.<plugin>.config.webSearch.*`. راجع صفحات المزوّدين
للاطلاع على أمثلة.

اختيار مزوّد الاحتياط لـ `web_fetch` منفصل:

- اختره عبر `tools.web.fetch.provider`
- أو احذف ذلك الحقل ودَع OpenClaw يكتشف تلقائيًا أول مزوّد web-fetch جاهز
  من بيانات الاعتماد المتاحة
- يمثّل Firecrawl اليوم مزوّد web-fetch المضمّن، ويُضبط تحت
  `plugins.entries.firecrawl.config.webFetch.*`

عندما تختار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`، يمكن لـ OpenClaw أيضًا أن يسأل عن:

- منطقة Moonshot API ‏(`https://api.moonshot.ai/v1` أو `https://api.moonshot.cn/v1`)
- نموذج Kimi الافتراضي للبحث على الويب (الافتراضي هو `kimi-k2.6`)

بالنسبة إلى `x_search`، اضبط `plugins.entries.xai.config.xSearch.*`. فهو يستخدم
الاحتياط نفسه `XAI_API_KEY` المستخدم في بحث الويب الخاص بـ Grok.
ويتم ترحيل الإعداد القديم `tools.web.x_search.*` تلقائيًا بواسطة `openclaw doctor --fix`.
وعندما تختار Grok أثناء `openclaw onboard` أو `openclaw configure --section web`,
يمكن لـ OpenClaw أيضًا تقديم إعداد `x_search` اختياري باستخدام المفتاح نفسه.
وتمثل هذه خطوة متابعة منفصلة داخل مسار Grok، وليست اختيارًا علويًا منفصلًا
لمزوّد البحث على الويب. وإذا اخترت مزوّدًا آخر، فلن يعرض OpenClaw
مطالبة `x_search`.

### تخزين مفاتيح API

<Tabs>
  <Tab title="ملف الإعداد">
    شغّل `openclaw configure --section web` أو اضبط المفتاح مباشرةً:

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
    اضبط متغير env الخاص بالمزوّد في بيئة عملية Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    وبالنسبة إلى تثبيت gateway، ضعه في `~/.openclaw/.env`.
    راجع [متغيرات env](/ar/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## معاملات الأداة

| المعامل               | الوصف                                                     |
| --------------------- | --------------------------------------------------------- |
| `query`               | استعلام البحث (مطلوب)                                     |
| `count`               | النتائج المطلوب إرجاعها (1-10، الافتراضي: 5)              |
| `country`             | رمز البلد ISO من حرفين (مثل `"US"` أو `"DE"`)             |
| `language`            | رمز اللغة ISO 639-1 ‏(مثل `"en"` أو `"de"`)               |
| `search_lang`         | رمز لغة البحث (Brave فقط)                                 |
| `freshness`           | عامل تصفية الوقت: `day` أو `week` أو `month` أو `year`    |
| `date_after`          | النتائج بعد هذا التاريخ (YYYY-MM-DD)                      |
| `date_before`         | النتائج قبل هذا التاريخ (YYYY-MM-DD)                      |
| `ui_lang`             | رمز لغة الواجهة (Brave فقط)                               |
| `domain_filter`       | مصفوفة قائمة سماح/حظر للنطاقات (Perplexity فقط)          |
| `max_tokens`          | الميزانية الكلية للمحتوى، الافتراضي 25000 (Perplexity فقط) |
| `max_tokens_per_page` | حد الرموز لكل صفحة، الافتراضي 2048 (Perplexity فقط)       |

<Warning>
  لا تعمل جميع المعاملات مع جميع المزوّدين. إذ يرفض وضع Brave ‏`llm-context`
  القيم `ui_lang` و`freshness` و`date_after` و`date_before`.
  وتعيد Gemini وGrok وKimi إجابة مركبة واحدة مع استشهادات. وهي
  تقبل `count` من أجل توافق الأداة المشتركة، لكنه لا يغيّر
  شكل الإجابة المؤسَّسة.
  ويتصرف Perplexity بالطريقة نفسها عندما تستخدم مسار التوافق الخاص بـ Sonar/OpenRouter
  ‏(`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` أو `OPENROUTER_API_KEY`).
  ولا يقبل SearXNG الصيغة `http://` إلا لمضيفات الشبكات الخاصة الموثوقة أو local loopback؛
  أما نقاط نهاية SearXNG العامة فيجب أن تستخدم `https://`.
  ولا يدعم Firecrawl وTavily إلا `query` و`count` عبر `web_search`
  -- استخدم الأدوات المخصصة لهما من أجل الخيارات المتقدمة.
</Warning>

## x_search

تستعلم `x_search` عن منشورات X ‏(المعروفة سابقًا باسم Twitter) باستخدام xAI وتعيد
إجابات مركبة بالذكاء الاصطناعي مع استشهادات. وهي تقبل استعلامات بلغة طبيعية
وعوامل تصفية منظّمة اختيارية. ولا يفعّل OpenClaw أداة `x_search`
المضمّنة الخاصة بـ xAI إلا على الطلب الذي يخدم هذا الاستدعاء للأداة.

<Note>
  توثق xAI الأداة `x_search` على أنها تدعم البحث بالكلمات المفتاحية، والبحث الدلالي، وبحث المستخدم،
  وجلب السلاسل. أما بالنسبة إلى إحصاءات التفاعل الخاصة بكل منشور مثل إعادة النشر،
  والردود، والإشارات المرجعية، أو المشاهدات، ففضّل بحثًا موجّهًا لعنوان URL الخاص بالمنشور
  أو معرّف الحالة تحديدًا. وقد تعثر عمليات البحث العامة بالكلمات المفتاحية على المنشور الصحيح لكنها تعيد
  بيانات وصفية أقل اكتمالًا لكل منشور. والنمط الجيد هو: حدّد المنشور أولًا، ثم
  شغّل استعلام `x_search` ثانيًا مركّزًا على ذلك المنشور بعينه.
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
            apiKey: "xai-...", // اختياري إذا كان XAI_API_KEY مضبوطًا
          },
        },
      },
    },
  },
}
```

### معاملات x_search

| المعامل                     | الوصف                                                     |
| --------------------------- | --------------------------------------------------------- |
| `query`                     | استعلام البحث (مطلوب)                                     |
| `allowed_x_handles`         | قصر النتائج على حسابات X محددة                            |
| `excluded_x_handles`        | استبعاد حسابات X محددة                                    |
| `from_date`                 | تضمين المنشورات في هذا التاريخ أو بعده فقط (YYYY-MM-DD)   |
| `to_date`                   | تضمين المنشورات في هذا التاريخ أو قبله فقط (YYYY-MM-DD)   |
| `enable_image_understanding`| السماح لـ xAI بفحص الصور المرفقة بالمنشورات المطابقة      |
| `enable_video_understanding`| السماح لـ xAI بفحص الفيديوهات المرفقة بالمنشورات المطابقة |

### مثال على x_search

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

- [Web Fetch](/ar/tools/web-fetch) -- جلب URL واستخراج محتوى قابل للقراءة
- [متصفح الويب](/ar/tools/browser) -- أتمتة متصفح كاملة للمواقع المعتمدة بكثرة على JS
- [Grok Search](/ar/tools/grok-search) -- استخدام Grok كمزوّد `web_search`
- [Ollama Web Search](/ar/tools/ollama-search) -- بحث على الويب لا يحتاج إلى مفتاح عبر مضيف Ollama الخاص بك
