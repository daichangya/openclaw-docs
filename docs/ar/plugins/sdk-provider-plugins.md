---
read_when:
    - أنت تبني Plugin جديدًا لموفّر نماذج
    - أنت تريد إضافة وكيل متوافق مع OpenAI أو LLM مخصص إلى OpenClaw
    - أنت بحاجة إلى فهم مصادقة الموفّر، والفهارس، وخطافات وقت التشغيل
sidebarTitle: Provider Plugins
summary: دليل خطوة بخطوة لبناء Plugin لموفّر نماذج في OpenClaw
title: بناء Plugins الموفّر
x-i18n:
    generated_at: "2026-04-21T07:25:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 459761118c7394c1643c170edfec97c87e1c6323b436183b53ad7a2fed783b04
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# بناء Plugins الموفّر

يرشدك هذا الدليل خلال بناء Plugin لموفّر يضيف موفّر نماذج
(LLM) إلى OpenClaw. وبنهاية هذا الدليل سيكون لديك موفّر مع فهرس نماذج،
ومصادقة بمفتاح API، وحل ديناميكي للنماذج.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ أولًا
  [البدء](/ar/plugins/building-plugins) لمعرفة بنية الحزمة الأساسية
  وإعداد manifest.
</Info>

<Tip>
  تضيف Plugins الموفّر النماذج إلى حلقة الاستدلال العادية في OpenClaw. وإذا كان النموذج
  يجب أن يعمل عبر daemon عامل أصلي يملك السلاسل، أو Compaction، أو
  أحداث الأدوات، فقم بإقران الموفّر مع [agent harness](/ar/plugins/sdk-agent-harness)
  بدلًا من وضع تفاصيل بروتوكول daemon في النواة.
</Tip>

## الشرح العملي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة وmanifest">
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

    تعلن manifest عن `providerAuthEnvVars` حتى يتمكن OpenClaw من اكتشاف
    بيانات الاعتماد من دون تحميل وقت تشغيل Plugin الخاص بك. أضف `providerAuthAliases`
    عندما ينبغي لمتغير موفّر ما أن يعيد استخدام مصادقة معرّف موفّر آخر. ويُعد `modelSupport`
    اختياريًا ويتيح لـ OpenClaw تحميل Plugin الموفّر لديك تلقائيًا من
    معرّفات نماذج مختصرة مثل `acme-large` قبل وجود خطافات وقت التشغيل. وإذا نشرت
    الموفّر على ClawHub، فإن حقلي `openclaw.compat` و`openclaw.build`
    في `package.json` يصبحان مطلوبين.

  </Step>

  <Step title="سجّل الموفّر">
    يحتاج الحد الأدنى من الموفّر إلى `id` و`label` و`auth` و`catalog`:

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

    هذا موفّر عامل. ويمكن للمستخدمين الآن
    `openclaw onboard --acme-ai-api-key <key>` ثم اختيار
    `acme-ai/acme-large` كنموذجهم.

    وإذا كان الموفّر العلوي يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
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

    يقوم `input` بإعادة كتابة موجّه النظام النهائي ومحتوى الرسائل النصية قبل
    النقل. ويقوم `output` بإعادة كتابة دلتا نصوص المساعد والنص النهائي قبل
    أن يحلل OpenClaw علامات التحكم الخاصة به أو تسليم القناة.

    بالنسبة إلى الموفّرين المضمّنين الذين يسجلون فقط موفّر نص واحد مع مصادقة
    بمفتاح API بالإضافة إلى وقت تشغيل واحد مدعوم بفهرس، ففضّل
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
        },
      },
    });
    ```

    وإذا كان تدفق المصادقة لديك يحتاج أيضًا إلى تصحيح `models.providers.*`، والأسماء المستعارة، و
    النموذج الافتراضي للعامل أثناء التهيئة، فاستخدم مساعدات الإعداد المسبق من
    `openclaw/plugin-sdk/provider-onboard`. وأضيق هذه المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    وعندما تدعم نقطة النهاية الأصلية للموفّر كتل الاستخدام المتدفقة على
    النقل العادي `openai-completions`، ففضّل المساعدات المشتركة للفهرس في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من تضمين فحوصات
    لمعرّف الموفّر بشكل ثابت. إذ يقوم `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` باكتشاف الدعم من خريطة قدرات
    نقطة النهاية، بحيث تستمر نقاط النهاية الأصلية على نمط Moonshot/DashScope
    في الاشتراك حتى عندما يستخدم Plugin معرّف موفّر مخصصًا.

  </Step>

  <Step title="أضف حلًا ديناميكيًا للنماذج">
    إذا كان موفّرك يقبل معرّفات نماذج اعتباطية (مثل الوكيل أو الموجّه)،
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

    وإذا كان الحل يتطلب استدعاءً للشبكة، فاستخدم `prepareDynamicModel` من أجل
    التهيئة غير المتزامنة — إذ يُشغَّل `resolveDynamicModel` مرة أخرى بعد اكتمالها.

  </Step>

  <Step title="أضف خطافات وقت التشغيل (عند الحاجة)">
    تحتاج معظم الموفّرات فقط إلى `catalog` + `resolveDynamicModel`. وأضف الخطافات
    تدريجيًا بحسب احتياجات موفّرك.

    تغطي بناة المساعدات المشتركة الآن عائلات إعادة التشغيل/توافق الأدوات
    الأكثر شيوعًا، لذلك لا تحتاج Plugins عادة إلى ربط كل خطاف يدويًا واحدًا واحدًا:

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

    | العائلة | ما الذي تضيفه |
    | --- | --- |
    | `openai-compatible` | سياسة إعادة تشغيل مشتركة على نمط OpenAI لوسائل النقل المتوافقة مع OpenAI، بما في ذلك تنقية معرّف استدعاء الأداة، وإصلاحات ترتيب المساعد أولًا، والتحقق العام من أدوار Gemini عندما يحتاج النقل إلى ذلك |
    | `anthropic-by-model` | سياسة إعادة تشغيل واعية بـ Claude تُختار بواسطة `modelId`، بحيث لا تحصل وسائل نقل رسائل Anthropic إلا على تنظيف كتل التفكير الخاصة بـ Claude عندما يكون النموذج المحلول فعلًا معرّف Claude |
    | `google-gemini` | سياسة إعادة تشغيل Gemini الأصلية بالإضافة إلى تنقية إعادة تشغيل التمهيد ووضع مخرجات الاستدلال الموسومة |
    | `passthrough-gemini` | تنقية thought-signature الخاصة بـ Gemini للنماذج التي تعمل عبر وسائل نقل وكيلة متوافقة مع OpenAI؛ ولا يفعّل التحقق الأصلي من إعادة تشغيل Gemini أو إعادات كتابة التمهيد |
    | `hybrid-anthropic-openai` | سياسة هجينة للموفّرين الذين يمزجون بين أسطح نماذج رسائل Anthropic والأسطح المتوافقة مع OpenAI في Plugin واحد؛ ويظل إسقاط كتل التفكير الخاصة بـ Claude فقط اختياريًا ومحصورًا في جانب Anthropic |

    أمثلة مضمّنة فعلية:

    - `google` و`google-gemini-cli`: ‏`google-gemini`
    - `openrouter` و`kilocode` و`opencode` و`opencode-go`: ‏`passthrough-gemini`
    - `amazon-bedrock` و`anthropic-vertex`: ‏`anthropic-by-model`
    - `minimax`: ‏`hybrid-anthropic-openai`
    - `moonshot` و`ollama` و`xai` و`zai`: ‏`openai-compatible`

    عائلات البث المتاحة حاليًا:

    | العائلة | ما الذي تضيفه |
    | --- | --- |
    | `google-thinking` | تطبيع حمولة التفكير الخاصة بـ Gemini على مسار البث المشترك |
    | `kilocode-thinking` | غلاف الاستدلال الخاص بـ Kilo على مسار البث الوكيل المشترك، مع تخطي التفكير المحقون في `kilo/auto` ومعرّفات الاستدلال الوكيل غير المدعومة |
    | `moonshot-thinking` | ربط حمولة التفكير الأصلي الثنائي في Moonshot انطلاقًا من الإعداد + مستوى `/think` |
    | `minimax-fast-mode` | إعادة كتابة نموذج الوضع السريع في MiniMax على مسار البث المشترك |
    | `openai-responses-defaults` | أغلفة Responses الأصلية المشتركة لـ OpenAI/Codex: ترويسات النسب، و`/fast`/`serviceTier`، وشدة النص، والبحث الأصلي على الويب في Codex، وتشكيل حمولة التوافق مع الاستدلال، وإدارة سياق Responses |
    | `openrouter-thinking` | غلاف الاستدلال الخاص بـ OpenRouter لمسارات الوكيل، مع معالجة تخطي النماذج غير المدعومة/`auto` مركزيًا |
    | `tool-stream-default-on` | غلاف `tool_stream` مفعّل افتراضيًا لموفّرين مثل Z.AI يريدون بث الأدوات ما لم يُعطّل صراحة |

    أمثلة مضمّنة فعلية:

    - `google` و`google-gemini-cli`: ‏`google-thinking`
    - `kilocode`: ‏`kilocode-thinking`
    - `moonshot`: ‏`moonshot-thinking`
    - `minimax` و`minimax-portal`: ‏`minimax-fast-mode`
    - `openai` و`openai-codex`: ‏`openai-responses-defaults`
    - `openrouter`: ‏`openrouter-thinking`
    - `zai`: ‏`tool-stream-default-on`

    يصدّر `openclaw/plugin-sdk/provider-model-shared` أيضًا تعداد عائلات إعادة التشغيل
    بالإضافة إلى المساعدات المشتركة التي تُبنى منها هذه العائلات. وتشمل
    التصديرات العامة الشائعة:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - بناة إعادة التشغيل المشتركة مثل `buildOpenAICompatibleReplayPolicy(...)`،
      و`buildAnthropicReplayPolicyForModel(...)`،
      و`buildGoogleGeminiReplayPolicy(...)`، و
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - مساعدات إعادة تشغيل Gemini مثل `sanitizeGoogleGeminiReplayHistory(...)`
      و`resolveTaggedReasoningOutputMode()`
    - مساعدات نقطة النهاية/النموذج مثل `resolveProviderEndpoint(...)`،
      و`normalizeProviderId(...)`، و`normalizeGooglePreviewModelId(...)`، و
      `normalizeNativeXaiModelId(...)`

    يوفّر `openclaw/plugin-sdk/provider-stream` كلًا من باني العائلة
    ومساعدات الأغلفة العامة التي تعيد هذه العائلات استخدامها. وتشمل
    التصديرات العامة الشائعة:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - أغلفة OpenAI/Codex المشتركة مثل
      `createOpenAIAttributionHeadersWrapper(...)`،
      و`createOpenAIFastModeWrapper(...)`،
      و`createOpenAIServiceTierWrapper(...)`،
      و`createOpenAIResponsesContextManagementWrapper(...)`، و
      `createCodexNativeWebSearchWrapper(...)`
    - أغلفة الوكيل/الموفّر المشتركة مثل `createOpenRouterWrapper(...)`،
      و`createToolStreamWrapper(...)`، و`createMinimaxFastModeWrapper(...)`

    تبقى بعض مساعدات البث محلية للموفّر عمدًا. والمثال المضمّن الحالي:
    يصدّر `@openclaw/anthropic-provider`
    الدوال `wrapAnthropicProviderStream`، و`resolveAnthropicBetas`،
    و`resolveAnthropicFastMode`، و`resolveAnthropicServiceTier`، بالإضافة إلى
    بناة أغلفة Anthropic منخفضة المستوى من السطح العام `api.ts` /
    `contract-api.ts`. وتظل هذه المساعدات خاصة بـ Anthropic لأنها
    ترمز أيضًا إلى معالجة Claude OAuth beta وتقييد `context1m`.

    كما تحتفظ موفّرات مضمّنة أخرى بأغلفة النقل الخاصة بها محليًا عندما
    لا يمكن مشاركة السلوك بشكل نظيف عبر العائلات. والمثال الحالي: يحتفظ
    Plugin ‏xAI المضمّن بتشكيل Responses الأصلي الخاص بـ xAI داخل
    `wrapStreamFn` الخاص به، بما في ذلك إعادة كتابة الأسماء المستعارة `/fast`،
    و`tool_stream` الافتراضي، وتنظيف الأدوات الصارمة غير المدعومة، وإزالة
    حمولة الاستدلال الخاصة بـ xAI.

    يوفّر `openclaw/plugin-sdk/provider-tools` حاليًا عائلة مشتركة واحدة
    لمخطط الأدوات بالإضافة إلى مساعدات مشتركة للمخطط/التوافق:

    - يوثّق `ProviderToolCompatFamily` قائمة العائلات المشتركة الحالية.
    - يربط `buildProviderToolCompatFamilyHooks("gemini")` بين تنظيف مخطط Gemini
      + التشخيصات للموفّرين الذين يحتاجون إلى مخططات أدوات آمنة لـ Gemini.
    - يُعد `normalizeGeminiToolSchemas(...)` و`inspectGeminiToolSchemas(...)`
      المساعدَين العامَّين الأساسيين لمخطط Gemini.
    - يعيد `resolveXaiModelCompatPatch()` تصحيح التوافق المضمّن لـ xAI:
      ‏`toolSchemaProfile: "xai"`، والكلمات المفتاحية غير المدعومة في المخطط، والدعم الأصلي
      لـ `web_search`، وفك ترميز وسائط استدعاء الأدوات ذات كيانات HTML.
    - يطبق `applyXaiModelCompat(model)` تصحيح التوافق نفسه الخاص بـ xAI على
      نموذج محلول قبل أن يصل إلى المشغّل.

    مثال مضمّن فعلي: يستخدم Plugin ‏xAI الدالتين `normalizeResolvedModel` بالإضافة إلى
    `contributeResolvedModelCompat` لإبقاء بيانات التوافق الوصفية هذه مملوكة من
    الموفّر بدلًا من تضمين قواعد xAI في النواة.

    ويدعم النمط نفسه القائم على جذر الحزمة موفّرات مضمّنة أخرى أيضًا:

    - `@openclaw/openai-provider`: يصدّر `api.ts` بناة الموفّر،
      ومساعدات النموذج الافتراضي، وبناة الموفّر اللحظي
    - `@openclaw/openrouter-provider`: يصدّر `api.ts` باني الموفّر
      بالإضافة إلى مساعدات التهيئة/الإعداد

    <Tabs>
      <Tab title="تبادل الرموز">
        بالنسبة إلى الموفّرين الذين يحتاجون إلى تبادل رمز قبل كل استدعاء استدلال:

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
      <Tab title="ترويسات مخصصة">
        بالنسبة إلى الموفّرين الذين يحتاجون إلى ترويسات طلب مخصصة أو تعديلات على جسم الطلب:

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
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
        بالنسبة إلى الموفّرين الذين يحتاجون إلى ترويسات أو بيانات وصفية أصلية للطلب/الجلسة على
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
        بالنسبة إلى الموفّرين الذين يعرضون بيانات الاستخدام/الفوترة:

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

    <Accordion title="جميع خطافات الموفّر المتاحة">
      يستدعي OpenClaw الخطافات بهذا الترتيب. ومعظم الموفّرين يستخدمون 2-3 فقط:

      | # | الخطاف | متى يُستخدم |
      | --- | --- | --- |
      | 1 | `catalog` | فهرس النماذج أو افتراضيات عنوان URL الأساسي |
      | 2 | `applyConfigDefaults` | افتراضيات عامة مملوكة للموفّر أثناء تشكيل الإعداد |
      | 3 | `normalizeModelId` | تنظيف الأسماء المستعارة القديمة/المعاينة لمعرّف النموذج قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` الخاص بعائلة الموفّر قبل التجميع العام للنموذج |
      | 5 | `normalizeConfig` | تطبيع إعداد `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادات كتابة توافق استخدام البث الأصلي لموفّري الإعداد |
      | 7 | `resolveConfigApiKey` | حل المصادقة بعلامات البيئة المملوك من الموفّر |
      | 8 | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/مستضافة ذاتيًا أو مدعومة بالإعداد |
      | 9 | `shouldDeferSyntheticProfileAuth` | إنزال أولوية العناصر النائبة الاصطناعية المخزنة خلف مصادقة البيئة/الإعداد |
      | 10 | `resolveDynamicModel` | قبول معرّفات نماذج علوية اعتباطية |
      | 11 | `prepareDynamicModel` | جلب بيانات وصفية غير متزامن قبل الحل |
      | 12 | `normalizeResolvedModel` | إعادات كتابة النقل قبل المشغّل |

    ملاحظات الرجوع الاحتياطي وقت التشغيل:

    - يتحقق `normalizeConfig` أولًا من الموفّر المطابق، ثم من Plugins
      الموفّر الأخرى القادرة على استخدام الخطاف حتى يقوم أحدها فعلًا بتغيير
      الإعداد. وإذا لم يُعد أي خطاف موفّر كتابة إدخال إعداد مدعوم من عائلة Google،
      فسيظل مطبّع إعداد Google المضمّن يُطبَّق.
    - يستخدم `resolveConfigApiKey` خطاف الموفّر عندما يكون مكشوفًا. كما يحتوي
      المسار المضمّن `amazon-bedrock` أيضًا على محلّل مدمج لعلامات بيئة AWS هنا،
      رغم أن مصادقة وقت تشغيل Bedrock نفسها لا تزال تستخدم السلسلة
      الافتراضية لـ AWS SDK.
      | 13 | `contributeResolvedModelCompat` | إشارات التوافق لنماذج المورّد خلف نقل متوافق آخر |
      | 14 | `capabilities` | حقيبة قدرات ثابتة قديمة؛ للتوافق فقط |
      | 15 | `normalizeToolSchemas` | تنظيف مخطط الأدوات المملوك من الموفّر قبل التسجيل |
      | 16 | `inspectToolSchemas` | تشخيصات مخطط الأدوات المملوكة من الموفّر |
      | 17 | `resolveReasoningOutputMode` | عقد مخرجات الاستدلال الموسومة مقابل الأصلية |
      | 18 | `prepareExtraParams` | معاملات الطلب الافتراضية |
      | 19 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 20 | `wrapStreamFn` | أغلفة ترويسات/جسم مخصصة على مسار البث العادي |
      | 21 | `resolveTransportTurnState` | ترويسات/بيانات وصفية أصلية لكل دورة |
      | 22 | `resolveWebSocketSessionPolicy` | ترويسات جلسة WS أصلية/فترة تهدئة |
      | 23 | `formatApiKey` | شكل رمز وقت تشغيل مخصص |
      | 24 | `refreshOAuth` | تحديث OAuth مخصص |
      | 25 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 26 | `matchesContextOverflowError` | كشف تجاوز مملوك من الموفّر |
      | 27 | `classifyFailoverReason` | تصنيف مملوك من الموفّر لحد المعدل/التحميل الزائد |
      | 28 | `isCacheTtlEligible` | تقييد TTL لذاكرة التخزين المؤقت للموجّه |
      | 29 | `buildMissingAuthMessage` | تلميح مخصص عند غياب المصادقة |
      | 30 | `suppressBuiltInModel` | إخفاء الصفوف العلوية القديمة |
      | 31 | `augmentModelCatalog` | صفوف اصطناعية للتوافق المستقبلي |
      | 32 | `isBinaryThinking` | التفكير الثنائي تشغيل/إيقاف |
      | 33 | `supportsXHighThinking` | دعم الاستدلال `xhigh` |
      | 34 | `supportsAdaptiveThinking` | دعم التفكير التكيفي |
      | 35 | `supportsMaxThinking` | دعم `max` |
      | 36 | `resolveDefaultThinkingLevel` | سياسة `/think` الافتراضية |
      | 37 | `isModernModelRef` | مطابقة النماذج الحية/الاختبارية |
      | 38 | `prepareRuntimeAuth` | تبادل الرموز قبل الاستدلال |
      | 39 | `resolveUsageAuth` | تحليل مخصص لبيانات اعتماد الاستخدام |
      | 40 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 41 | `createEmbeddingProvider` | مهيئ تضمين مملوك من الموفّر للذاكرة/البحث |
      | 42 | `buildReplayPolicy` | سياسة مخصصة لإعادة تشغيل/Compaction النص |
      | 43 | `sanitizeReplayHistory` | إعادات كتابة خاصة بالموفّر لسجل إعادة التشغيل بعد التنظيف العام |
      | 44 | `validateReplayTurns` | تحقق صارم من دورات إعادة التشغيل قبل المشغّل المضمّن |
      | 45 | `onModelSelected` | callback بعد الاختيار (مثل القياس عن بُعد) |

      ملاحظة حول ضبط الموجّه:

      - يتيح `resolveSystemPromptContribution` للموفّر حقن
        إرشادات موجّه نظام واعية بالذاكرة المؤقتة لعائلة نماذج. ويفضَّل استخدامه بدلًا من
        `before_prompt_build` عندما يكون السلوك تابعًا لموفّر/عائلة نماذج واحدة
        ويجب أن يحافظ على تقسيم الذاكرة المؤقتة بين المستقر/الديناميكي.

      للاطلاع على أوصاف تفصيلية وأمثلة واقعية، راجع
      [الداخليات: خطافات وقت تشغيل الموفّر](/ar/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="أضف قدرات إضافية (اختياري)">
    <a id="step-5-add-extra-capabilities"></a>
    يمكن لـ Plugin الموفّر تسجيل الكلام، والنسخ الفوري، والصوت الفوري،
    وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب،
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
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
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

    يصنّف OpenClaw هذا على أنه Plugin **ذو قدرات هجينة**. وهذا هو
    النمط الموصى به لـ Plugins الشركات (Plugin واحد لكل مورّد). راجع
    [الداخليات: ملكية القدرات](/ar/plugins/architecture#capability-ownership-model).

    بالنسبة إلى توليد الفيديو، فضّل شكل القدرات الواعي بالأوضاع الموضح أعلاه:
    `generate`، و`imageToVideo`، و`videoToVideo`. ولا تكفي الحقول
    التجميعية المسطحة مثل `maxInputImages`، و`maxInputVideos`، و`maxDurationSeconds`
    للإعلان عن دعم أوضاع التحويل أو الأوضاع المعطلة بشكل نظيف.

    وينبغي لموفّري توليد الموسيقى اتباع النمط نفسه:
    `generate` للتوليد المعتمد على الموجّه فقط، و`edit` للتوليد المعتمد
    على صورة مرجعية. ولا تكفي الحقول التجميعية المسطحة مثل `maxInputImages`،
    و`supportsLyrics`، و`supportsFormat` للإعلان عن دعم التحرير؛ إذ إن كتل
    `generate` / `edit` الصريحة هي العقد المتوقع.

  </Step>

  <Step title="اختبر">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
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

تُنشر Plugins الموفّر بالطريقة نفسها مثل أي Plugin كود خارجي آخر:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم هنا الاسم المستعار القديم المخصص للنشر الخاص بـ Skills فقط؛ إذ يجب أن تستخدم
حزم Plugins الأمر `clawhub package publish`.

## بنية الملفات

```
<bundled-plugin-root>/acme-ai/
├── package.json              # بيانات تعريف openclaw.providers
├── openclaw.plugin.json      # Manifest مع بيانات تعريف مصادقة الموفّر
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # اختبارات
    └── usage.ts              # نقطة نهاية الاستخدام (اختياري)
```

## مرجع ترتيب الفهرس

يتحكم `catalog.order` في وقت دمج فهرسك بالنسبة إلى
الموفّرين المضمّنين:

| الترتيب   | متى            | حالة الاستخدام                                  |
| --------- | -------------- | ----------------------------------------------- |
| `simple`  | التمريرة الأولى | موفّرو مفاتيح API البسيطة                       |
| `profile` | بعد simple     | موفّرون مقيدون بملفات تعريف المصادقة            |
| `paired`  | بعد profile    | توليف عدة إدخالات مرتبطة                        |
| `late`    | التمريرة الأخيرة | تجاوز الموفّرين الموجودين (يفوز عند التصادم)    |

## الخطوات التالية

- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — إذا كان Plugin الخاص بك يوفّر قناة أيضًا
- [وقت تشغيل SDK](/ar/plugins/sdk-runtime) — مساعدات `api.runtime` ‏(TTS، والبحث، والعامل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل للاستيراد عبر المسارات الفرعية
- [داخليات Plugin](/ar/plugins/architecture#provider-runtime-hooks) — تفاصيل الخطافات والأمثلة المضمّنة
