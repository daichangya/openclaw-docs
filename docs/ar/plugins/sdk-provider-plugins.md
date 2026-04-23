---
read_when:
    - أنت تبني Plugin مزوّد نماذج جديدة
    - تريد إضافة proxy متوافق مع OpenAI أو LLM مخصصة إلى OpenClaw
    - تحتاج إلى فهم مصادقة المزوّد، والكتالوجات، وخطافات وقت التشغيل
sidebarTitle: Provider Plugins
summary: دليل خطوة بخطوة لبناء Plugin مزوّد نماذج لـ OpenClaw
title: بناء Plugins المزوّدين
x-i18n:
    generated_at: "2026-04-23T07:29:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba14ad9c9ac35c6209b6533e50ab3a6da0ef0de2ea6a6a4e7bf69bc65d39c484
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# بناء Plugins المزوّدين

يرشدك هذا الدليل خلال بناء Plugin مزوّد تضيف مزوّد نماذج
(LLM) إلى OpenClaw. وبنهاية هذا الدليل ستكون لديك Plugin مزوّد تضم كتالوج نماذج،
ومصادقة بمفتاح API، وحلًا ديناميكيًا للنماذج.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا لمعرفة بنية الحزمة الأساسية
  وإعداد البيان.
</Info>

<Tip>
  تضيف Plugins المزوّدين نماذج إلى حلقة الاستدلال العادية في OpenClaw. وإذا كان النموذج
  يجب أن يعمل عبر daemon وكيل أصلية تملك السلاسل وCompaction أو أحداث
  الأدوات، فاقرن المزوّد مع [agent harness](/ar/plugins/sdk-agent-harness)
  بدلًا من وضع تفاصيل بروتوكول daemon في النواة.
</Tip>

## الشرح التفصيلي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة والبيان">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    يعلن البيان `providerAuthEnvVars` حتى يتمكن OpenClaw من اكتشاف
    بيانات الاعتماد من دون تحميل وقت تشغيل Plugin الخاصة بك. أضف `providerAuthAliases`
    عندما ينبغي أن يعيد متغير مزوّد استخدام مصادقة معرّف مزوّد آخر. وتُعد `modelSupport`
    اختيارية وتتيح لـ OpenClaw تحميل Plugin المزوّد الخاصة بك تلقائيًا من
    معرّفات النماذج المختصرة مثل `acme-large` قبل وجود خطافات وقت التشغيل. وإذا نشرت
    المزوّد على ClawHub، فستكون الحقول `openclaw.compat` و`openclaw.build`
    مطلوبة في `package.json`.

  </Step>

  <Step title="سجّل المزوّد">
    يحتاج المزوّد الأدنى إلى `id` و`label` و`auth` و`catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    هذا مزوّد عامل بالفعل. ويمكن للمستخدمين الآن تنفيذ
    `openclaw onboard --acme-ai-api-key <key>` واختيار
    `acme-ai/acme-large` كنموذج لهم.

    إذا كان المزوّد upstream يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
    تحويلًا نصيًا صغيرًا ثنائي الاتجاه بدلًا من استبدال مسار البث:

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    تعيد `input` كتابة مطالبة النظام النهائية ومحتوى الرسالة النصية قبل
    النقل. وتعيد `output` كتابة فروق نص المساعد والنص النهائي قبل
    أن يحلل OpenClaw علامات التحكم الخاصة به أو تسليم القناة.

    بالنسبة إلى المزوّدين المضمّنين الذين يسجلون مزوّد نص واحدًا فقط مع
    مصادقة بمفتاح API بالإضافة إلى وقت تشغيل واحد مدعوم بكتالوج، ففضّل
    المساعد الأضيق `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    يمثل `buildProvider` مسار الكتالوج الحي المستخدم عندما يستطيع OpenClaw حل
    مصادقة مزوّد فعلية. وقد ينفذ اكتشافًا خاصًا بالمزوّد. واستخدم
    `buildStaticProvider` فقط للصفوف غير المتصلة الآمنة للعرض قبل ضبط المصادقة؛ ويجب ألا يتطلب بيانات اعتماد أو ينفذ طلبات شبكة.
    وينفذ عرض `models list --all` في OpenClaw حاليًا الكتالوجات الثابتة
    فقط من أجل Plugins المزوّدين المضمّنة، مع إعداد فارغ وenv فارغة ومن دون
    مسارات وكيل/مساحة عمل.

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى تعديل `models.providers.*`،
    والأسماء البديلة، والنموذج الافتراضي للوكيل أثناء الإعداد الأوّلي، فاستخدم مساعدات
    القوالب المسبقة من `openclaw/plugin-sdk/provider-onboard`. وأضيق المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية لمزوّد ما كتل استخدام البث على
    النقل العادي `openai-completions`، ففضّل مساعدات الكتالوج المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من ترميز فحوصات معرّف
    المزوّد يدويًا. وتكتشف `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` الدعم من خريطة قدرات نقطة
    النهاية، بحيث تظل نقاط النهاية الأصلية على نمط Moonshot/DashScope
    تشترك في هذا حتى عندما تستخدم Plugin معرّف مزوّد مخصصًا.

  </Step>

  <Step title="أضف حل النماذج الديناميكي">
    إذا كان المزوّد لديك يقبل معرّفات نماذج اعتباطية (مثل proxy أو router)،
    فأضف `resolveDynamicModel`:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    إذا كان الحل يتطلب طلب شبكة، فاستخدم `prepareDynamicModel` من أجل
    التهيئة غير المتزامنة — إذ يعمل `resolveDynamicModel` مرة أخرى بعد اكتمالها.

  </Step>

  <Step title="أضف خطافات وقت التشغيل (عند الحاجة)">
    لا تحتاج معظم المزوّدات إلا إلى `catalog` + `resolveDynamicModel`. أضف الخطافات
    تدريجيًا بحسب ما يتطلبه مزوّدك.

    تغطي بُناة المساعدات المشتركة الآن أكثر عائلات إعادة التشغيل/توافق الأدوات
    شيوعًا، لذلك لا تحتاج Plugins عادةً إلى توصيل كل خطاف يدويًا واحدًا واحدًا:

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    عائلات إعادة التشغيل المتاحة حاليًا:

    | العائلة | ما الذي توصله |
    | --- | --- |
    | `openai-compatible` | سياسة إعادة تشغيل مشتركة على نمط OpenAI لوسائط النقل المتوافقة مع OpenAI، بما في ذلك تنظيف معرّف استدعاء الأدوات، وإصلاحات ترتيب المساعد أولًا، والتحقق العام من دور Gemini عندما يحتاج النقل إلى ذلك |
    | `anthropic-by-model` | سياسة إعادة تشغيل مدركة لـ Claude يتم اختيارها حسب `modelId`، بحيث لا تحصل وسائط نقل رسائل Anthropic على تنظيف كتل التفكير الخاصة بـ Claude إلا عندما يكون النموذج المحدد فعلًا معرّف Claude |
    | `google-gemini` | سياسة إعادة تشغيل Gemini الأصلية بالإضافة إلى تنظيف bootstrap لإعادة التشغيل ووضع خرج الاستدلال الموسوم |
    | `passthrough-gemini` | تنظيف thought-signature الخاصة بـ Gemini للنماذج العاملة عبر وسائط proxy المتوافقة مع OpenAI؛ ولا يفعّل التحقق الأصلي لإعادة تشغيل Gemini أو إعادة كتابة bootstrap |
    | `hybrid-anthropic-openai` | سياسة هجينة للمزوّدين الذين يمزجون أسطح نماذج رسائل Anthropic والنماذج المتوافقة مع OpenAI في Plugin واحدة؛ ويظل إسقاط كتل التفكير الخاصة بـ Claude فقط، بشكل اختياري، محصورًا في جانب Anthropic |

    أمثلة مضمّنة فعلية:

    - `google` و`google-gemini-cli`: ‏`google-gemini`
    - `openrouter` و`kilocode` و`opencode` و`opencode-go`: ‏`passthrough-gemini`
    - `amazon-bedrock` و`anthropic-vertex`: ‏`anthropic-by-model`
    - `minimax`: ‏`hybrid-anthropic-openai`
    - `moonshot` و`ollama` و`xai` و`zai`: ‏`openai-compatible`

    عائلات البث المتاحة حاليًا:

    | العائلة | ما الذي توصله |
    | --- | --- |
    | `google-thinking` | تطبيع حمولة تفكير Gemini على مسار البث المشترك |
    | `kilocode-thinking` | مغلف استدلال Kilo على مسار بث proxy المشترك، مع تخطي حقن التفكير في `kilo/auto` ومعرّفات استدلال proxy غير المدعومة |
    | `moonshot-thinking` | ربط حمولة التفكير الأصلية الثنائية في Moonshot انطلاقًا من الإعداد + مستوى `/think` |
    | `minimax-fast-mode` | إعادة كتابة نموذج MiniMax في الوضع السريع على مسار البث المشترك |
    | `openai-responses-defaults` | مغلفات Responses الأصلية المشتركة لـ OpenAI/Codex: رؤوس الإسناد، و`/fast`/`serviceTier`، وإسهاب النص، والبحث الأصلي على الويب في Codex، وتشكيل حمولة توافق الاستدلال، وإدارة سياق Responses |
    | `openrouter-thinking` | مغلف استدلال OpenRouter لمسارات proxy، مع التعامل مركزيًا مع تخطي النماذج غير المدعومة/`auto` |
    | `tool-stream-default-on` | مغلف `tool_stream` مفعّل افتراضيًا لمزوّدين مثل Z.AI الذين يريدون بث الأدوات ما لم يتم تعطيله صراحةً |

    أمثلة مضمّنة فعلية:

    - `google` و`google-gemini-cli`: ‏`google-thinking`
    - `kilocode`: ‏`kilocode-thinking`
    - `moonshot`: ‏`moonshot-thinking`
    - `minimax` و`minimax-portal`: ‏`minimax-fast-mode`
    - `openai` و`openai-codex`: ‏`openai-responses-defaults`
    - `openrouter`: ‏`openrouter-thinking`
    - `zai`: ‏`tool-stream-default-on`

    يصدّر `openclaw/plugin-sdk/provider-model-shared` أيضًا التعداد الخاص بعائلة
    إعادة التشغيل بالإضافة إلى المساعدات المشتركة التي تُبنى منها هذه العائلات. وتشمل
    عمليات التصدير العامة الشائعة:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - بُناة إعادة التشغيل المشتركة مثل `buildOpenAICompatibleReplayPolicy(...)`،
      و`buildAnthropicReplayPolicyForModel(...)`،
      و`buildGoogleGeminiReplayPolicy(...)`، و
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - مساعدات إعادة تشغيل Gemini مثل `sanitizeGoogleGeminiReplayHistory(...)`
      و`resolveTaggedReasoningOutputMode()`
    - مساعدات نقاط النهاية/النماذج مثل `resolveProviderEndpoint(...)`،
      و`normalizeProviderId(...)`، و`normalizeGooglePreviewModelId(...)`، و
      `normalizeNativeXaiModelId(...)`

    يكشف `openclaw/plugin-sdk/provider-stream` عن باني العائلة وكذلك
    مساعدات المغلف العامة التي تعيد تلك العائلات استخدامها. وتشمل
    عمليات التصدير العامة الشائعة:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - مغلفات OpenAI/Codex المشتركة مثل
      `createOpenAIAttributionHeadersWrapper(...)`،
      و`createOpenAIFastModeWrapper(...)`،
      و`createOpenAIServiceTierWrapper(...)`،
      و`createOpenAIResponsesContextManagementWrapper(...)`، و
      `createCodexNativeWebSearchWrapper(...)`
    - مغلفات proxy/المزوّد المشتركة مثل `createOpenRouterWrapper(...)`،
      و`createToolStreamWrapper(...)`، و`createMinimaxFastModeWrapper(...)`

    تظل بعض مساعدات البث محلية للمزوّد عمدًا. المثال المضمّن الحالي:
    تصدّر `@openclaw/anthropic-provider`
    القيم `wrapAnthropicProviderStream` و`resolveAnthropicBetas`،
    و`resolveAnthropicFastMode`، و`resolveAnthropicServiceTier`، و
    بُناة المغلفات منخفضة المستوى الخاصة بـ Anthropic من خلال الحد الفاصل العام
    `api.ts` / `contract-api.ts`. وتظل هذه المساعدات خاصة بـ Anthropic لأنها
    ترمّز أيضًا التعامل مع Claude OAuth beta وبوابة `context1m`.

    كما تحتفظ مزوّدات مضمّنة أخرى أيضًا بمغلفات النقل الخاصة بها محليًا عندما
    لا يكون السلوك قابلًا للمشاركة بشكل نظيف عبر العائلات. المثال الحالي:
    تحتفظ Plugin المضمّنة الخاصة بـ xAI بتشكيل Responses الأصلي لـ xAI داخل
    `wrapStreamFn` الخاص بها، بما في ذلك إعادة كتابة الأسماء البديلة لـ `/fast`، والقيمة
    الافتراضية `tool_stream`، وتنظيف strict-tool غير المدعوم، وإزالة
    حمولات الاستدلال الخاصة بـ xAI.

    يكشف `openclaw/plugin-sdk/provider-tools` حاليًا عن عائلة واحدة مشتركة
    لتوافق مخططات الأدوات بالإضافة إلى مساعدات المخطط/التوافق المشتركة:

    - يوضّح `ProviderToolCompatFamily` مخزون العائلات المشتركة الحالي.
    - يقوم `buildProviderToolCompatFamilyHooks("gemini")` بتوصيل تنظيف مخطط Gemini
      + التشخيصات للمزوّدين الذين يحتاجون إلى مخططات أدوات آمنة مع Gemini.
    - تمثل `normalizeGeminiToolSchemas(...)` و`inspectGeminiToolSchemas(...)`
      مساعدات مخطط Gemini العامة الأساسية.
    - تعيد `resolveXaiModelCompatPatch()` تصحيح التوافق المضمّن الخاص بـ xAI:
      `toolSchemaProfile: "xai"`، والكلمات المفتاحية غير المدعومة في المخطط،
      ودعم `web_search` الأصلي، وفك ترميز وسائط استدعاء الأدوات المرمّزة بكيانات HTML.
    - تطبق `applyXaiModelCompat(model)` تصحيح التوافق نفسه الخاص بـ xAI على
      نموذج محلول قبل أن يصل إلى runner.

    مثال مضمّن فعلي: تستخدم Plugin الخاصة بـ xAI كلًا من `normalizeResolvedModel` و
    `contributeResolvedModelCompat` لكي تظل بيانات التوافق الوصفية هذه مملوكة
    للمزوّد بدلًا من ترميز قواعد xAI في النواة.

    ويمثل نمط جذر الحزمة نفسه أيضًا الأساس لمزوّدات مضمّنة أخرى:

    - `@openclaw/openai-provider`: يصدّر `api.ts` بُناة المزوّد،
      ومساعدات النموذج الافتراضي، وبُناة مزوّدات realtime
    - `@openclaw/openrouter-provider`: يصدّر `api.ts` باني المزوّد
      بالإضافة إلى مساعدات الإعداد الأوّلي/الإعداد

    <Tabs>
      <Tab title="تبادل الرموز">
        بالنسبة إلى المزوّدين الذين يحتاجون إلى تبادل رمز قبل كل استدعاء استدلال:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="رؤوس مخصصة">
        بالنسبة إلى المزوّدين الذين يحتاجون إلى رؤوس طلب مخصصة أو تعديلات على الجسم:

        ```typescript
        // تعيد wrapStreamFn قيمة StreamFn مشتقة من ctx.streamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="هوية النقل الأصلية">
        بالنسبة إلى المزوّدين الذين يحتاجون إلى رؤوس/بيانات وصفية أصلية للطلب/الجلسة على
        وسائل النقل العامة HTTP أو WebSocket:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="الاستخدام والفوترة">
        بالنسبة إلى المزوّدين الذين يكشفون بيانات الاستخدام/الفوترة:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="جميع خطافات المزوّد المتاحة">
      يستدعي OpenClaw الخطافات بهذا الترتيب. ولا تستخدم معظم المزوّدات إلا 2-3 منها:

      | # | الخطاف | متى يُستخدم |
      | --- | --- | --- |
      | 1 | `catalog` | كتالوج النماذج أو القيم الافتراضية لـ base URL |
      | 2 | `applyConfigDefaults` | القيم الافتراضية العامة المملوكة للمزوّد أثناء تجسيد الإعداد |
      | 3 | `normalizeModelId` | تنظيف الأسماء البديلة القديمة/المعاينة لمعرّف النموذج قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة المزوّد قبل التجميع العام للنموذج |
      | 5 | `normalizeConfig` | تطبيع إعداد `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق الاستخدام أثناء البث الأصلي لمزوّدي الإعداد |
      | 7 | `resolveConfigApiKey` | حل مصادقة env-marker المملوك للمزوّد |
      | 8 | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/ذاتية الاستضافة أو مدعومة بالإعداد |
      | 9 | `shouldDeferSyntheticProfileAuth` | خفض أولوية عناصر placeholder الاصطناعية للملف الشخصي المخزّن خلف مصادقة env/config |
      | 10 | `resolveDynamicModel` | قبول معرّفات نماذج upstream اعتباطية |
      | 11 | `prepareDynamicModel` | جلب بيانات وصفية غير متزامن قبل الحل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل runner |

    ملاحظات احتياط وقت التشغيل:

    - يتحقق `normalizeConfig` أولًا من المزوّد المطابق، ثم من Plugins
      المزوّدات الأخرى القادرة على الخطافات إلى أن يغيّر أحدها الإعداد فعليًا.
      وإذا لم يعِد أي خطاف مزوّد كتابة إدخال إعداد مدعوم من عائلة Google،
      فسيُطبَّق مطبّع الإعدادات المضمّن الخاص بـ Google على أي حال.
    - يستخدم `resolveConfigApiKey` خطاف المزوّد عند كشفه. كما أن المسار المضمّن
      الخاص بـ `amazon-bedrock` يملك أيضًا محلل AWS env-marker مضمّنًا هنا،
      رغم أن مصادقة وقت تشغيل Bedrock نفسها لا تزال تستخدم سلسلة AWS SDK
      الافتراضية.
      | 13 | `contributeResolvedModelCompat` | أعلام توافق لنماذج المورّدين خلف وسيلة نقل متوافقة أخرى |
      | 14 | `capabilities` | حزمة قدرات ثابتة قديمة؛ للتوافق فقط |
      | 15 | `normalizeToolSchemas` | تنظيف مخطط الأدوات المملوك للمزوّد قبل التسجيل |
      | 16 | `inspectToolSchemas` | تشخيصات مخطط الأدوات المملوكة للمزوّد |
      | 17 | `resolveReasoningOutputMode` | عقد خرج الاستدلال الموسوم مقابل الأصلي |
      | 18 | `prepareExtraParams` | معاملات الطلب الافتراضية |
      | 19 | `createStreamFn` | وسيلة نقل StreamFn مخصصة بالكامل |
      | 20 | `wrapStreamFn` | مغلفات رؤوس/جسم مخصصة على مسار البث العادي |
      | 21 | `resolveTransportTurnState` | رؤوس/بيانات وصفية أصلية لكل دورة |
      | 22 | `resolveWebSocketSessionPolicy` | رؤوس جلسة WS الأصلية/فترة التهدئة |
      | 23 | `formatApiKey` | بنية رمز وقت تشغيل مخصصة |
      | 24 | `refreshOAuth` | تحديث OAuth مخصص |
      | 25 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 26 | `matchesContextOverflowError` | اكتشاف فائض السياق المملوك للمزوّد |
      | 27 | `classifyFailoverReason` | تصنيف حد المعدّل/الحمل الزائد المملوك للمزوّد |
      | 28 | `isCacheTtlEligible` | بوابة TTL الخاصة بذاكرة prompt cache |
      | 29 | `buildMissingAuthMessage` | تلميح مخصص عند غياب المصادقة |
      | 30 | `suppressBuiltInModel` | إخفاء صفوف upstream القديمة |
      | 31 | `augmentModelCatalog` | صفوف توافق أمامي اصطناعية |
      | 32 | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | 33 | `isBinaryThinking` | توافق التفكير الثنائي تشغيل/إيقاف |
      | 34 | `supportsXHighThinking` | توافق دعم الاستدلال `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 36 | `isModernModelRef` | مطابقة النماذج الحية/نماذج smoke |
      | 37 | `prepareRuntimeAuth` | تبادل الرمز قبل الاستدلال |
      | 38 | `resolveUsageAuth` | تحليل مخصص لبيانات اعتماد الاستخدام |
      | 39 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 40 | `createEmbeddingProvider` | محول embedding مملوك للمزوّد من أجل الذاكرة/البحث |
      | 41 | `buildReplayPolicy` | سياسة إعادة تشغيل/Compaction مخصصة للنص الكامل |
      | 42 | `sanitizeReplayHistory` | إعادة كتابة خاصة بالمزوّد لإعادة التشغيل بعد التنظيف العام |
      | 43 | `validateReplayTurns` | تحقق صارم من دورات إعادة التشغيل قبل embedded runner |
      | 44 | `onModelSelected` | نداء بعد الاختيار (مثل telemetry) |

      ملاحظة حول ضبط المطالبات:

      - تتيح `resolveSystemPromptContribution` للمزوّد حقن
        إرشادات لمطالبة النظام مدركة للذاكرة المخبئية من أجل عائلة نماذج. وفضّلها على
        `before_prompt_build` عندما يكون السلوك تابعًا لمزوّد/عائلة نماذج واحدة
        ويجب أن يحافظ على فصل الذاكرة المخبئية بين الثابت والديناميكي.

      للاطلاع على أوصاف مفصلة وأمثلة واقعية، راجع
      [الداخليات: خطافات وقت تشغيل المزوّد](/ar/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="أضف قدرات إضافية (اختياري)">
    <a id="step-5-add-extra-capabilities"></a>
    يمكن لـ Plugin المزوّد تسجيل الكلام، والنسخ الفوري، والصوت
    الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب،
    والبحث على الويب إلى جانب الاستدلال النصي:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => {
          const apiKey = String(req.providerConfig.apiKey ?? "");
          return createRealtimeTranscriptionWebSocketSession({
            providerId: "acme-ai",
            callbacks: req,
            url: "wss://api.example.com/v1/realtime-transcription",
            headers: { Authorization: `Bearer ${apiKey}` },
            onMessage: (event, transport) => {
              if (event.type === "session.created") {
                transport.sendJson({ type: "session.update" });
                transport.markReady();
                return;
              }
              if (event.type === "transcript.final") {
                req.onTranscript?.(event.text);
              }
            },
            sendAudio: (audio, transport) => {
              transport.sendJson({
                type: "audio.append",
                audio: audio.toString("base64"),
              });
            },
            onClose: (transport) => {
              transport.sendJson({ type: "audio.end" });
            },
          });
        },
      });

      api.registerRealtimeVoiceProvider({
        id: "acme-ai",
        label: "Acme Realtime Voice",
        isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
        createBridge: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          setMediaTimestamp: () => {},
          submitToolResult: () => {},
          acknowledgeMark: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "Fetch pages through Acme's rendering backend.",
        envVars: ["ACME_FETCH_API_KEY"],
        placeholder: "acme-...",
        signupUrl: "https://acme.example.com/fetch",
        credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
        getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
        setCredentialValue: (fetchConfigTarget, value) => {
          const acme = (fetchConfigTarget.acme ??= {});
          acme.apiKey = value;
        },
        createTool: () => ({
          description: "Fetch a page through Acme Fetch.",
          parameters: {},
          execute: async (args) => ({ content: [] }),
        }),
      });

      api.registerWebSearchProvider({
        id: "acme-ai-search",
        label: "Acme Search",
        search: async (req) => ({ content: [] }),
      });
    }
    ```

    يصنّف OpenClaw هذا على أنه Plugin **hybrid-capability**. وهذا هو
    النمط الموصى به لـ Plugins الشركات (Plugin واحدة لكل مورّد). راجع
    [الداخليات: ملكية القدرات](/ar/plugins/architecture#capability-ownership-model).

    بالنسبة إلى توليد الفيديو، فضّل بنية القدرات المدركة للأوضاع الموضحة أعلاه:
    `generate` و`imageToVideo` و`videoToVideo`. ولا تكفي الحقول التجميعية
    المسطحة مثل `maxInputImages` و`maxInputVideos` و`maxDurationSeconds`
    للإعلان عن دعم أوضاع التحويل أو الأوضاع المعطّلة بشكل نظيف.

    فضّل المساعد المشترك لـ WebSocket لمزوّدي STT الباثين. فهو يُبقي
    التقاط proxy، وbackoff لإعادة الاتصال، وflush عند الإغلاق، ومصافحات الجاهزية،
    ووضع الصوت في الطابور، وتشخيصات أحداث الإغلاق متسقة عبر المزوّدين، مع
    ترك مسؤولية ربط أحداث upstream لشيفرة المزوّد فقط.

    ينبغي لمزوّدي STT الدفعيين الذين يرسلون صوت multipart عبر POST استخدام
    `buildAudioTranscriptionFormData(...)` من
    `openclaw/plugin-sdk/provider-http` مع مساعدات طلبات HTTP الخاصة بالمزوّد.
    ويقوم مساعد النموذج بتطبيع أسماء ملفات الرفع، بما في ذلك ملفات AAC
    التي تحتاج إلى اسم ملف على نمط M4A لتوافق APIs النسخ.

    ينبغي لمزوّدي توليد الموسيقى اتباع النمط نفسه:
    `generate` للتوليد المعتمد على المطالبة فقط، و`edit` للتوليد
    المعتمد على صورة مرجعية. ولا تكفي الحقول التجميعية المسطحة مثل `maxInputImages`،
    و`supportsLyrics`، و`supportsFormat` للإعلان عن دعم
    التحرير؛ إذ تمثل كتل `generate` / `edit` الصريحة العقد المتوقع.

  </Step>

  <Step title="اختبر">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // صدّر كائن إعداد المزوّد من index.ts أو من ملف مخصص
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## النشر إلى ClawHub

تُنشر Plugins المزوّدين بالطريقة نفسها التي تُنشر بها أي Plugin شيفرة خارجية أخرى:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم الاسم البديل القديم الخاص بنشر Skills فقط هنا؛ إذ يجب أن تستخدم
حزم Plugins الأمر `clawhub package publish`.

## بنية الملفات

```
<bundled-plugin-root>/acme-ai/
├── package.json              # بيانات openclaw.providers الوصفية
├── openclaw.plugin.json      # البيان مع بيانات مصادقة المزوّد الوصفية
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # الاختبارات
    └── usage.ts              # نقطة نهاية الاستخدام (اختياري)
```

## مرجع ترتيب الكتالوج

يتحكم `catalog.order` في توقيت دمج كتالوجك بالنسبة إلى
المزوّدين المضمّنين:

| الترتيب   | متى           | حالة الاستخدام                                  |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | التمريرة الأولى | مزوّدو مفاتيح API البسيطون                      |
| `profile` | بعد simple    | مزوّدون مقيّدون بملفات تعريف المصادقة           |
| `paired`  | بعد profile   | إنشاء عدة إدخالات مرتبطة اصطناعيًا              |
| `late`    | التمريرة الأخيرة | تجاوز المزوّدين الموجودين (يفوز عند التعارض)   |

## الخطوات التالية

- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — إذا كانت Plugin الخاصة بك توفّر قناة أيضًا
- [SDK Runtime](/ar/plugins/sdk-runtime) — مساعدات `api.runtime` ‏(TTS، والبحث، والوكيل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع استيراد المسارات الفرعية الكامل
- [داخليات Plugin](/ar/plugins/architecture#provider-runtime-hooks) — تفاصيل الخطافات والأمثلة المضمّنة
