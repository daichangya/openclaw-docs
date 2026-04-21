---
read_when:
    - أنت تبني Plugin جديدًا لمزوّد نماذج
    - تريد إضافة وكيل متوافق مع OpenAI أو LLM مخصص إلى OpenClaw
    - تحتاج إلى فهم مصادقة المزوّد، والكتالوجات، ووسائط ربط وقت التشغيل
sidebarTitle: Provider Plugins
summary: دليل خطوة بخطوة لبناء Plugin لمزوّد نماذج لـ OpenClaw
title: بناء Plugins لمزوّدي النماذج
x-i18n:
    generated_at: "2026-04-21T13:35:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08494658def4a003a1e5752f68d9232bfbbbf76348cf6f319ea1a6855c2ae439
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# بناء Plugins لمزوّدي النماذج

يوضح هذا الدليل كيفية بناء Plugin لمزوّد يضيف مزوّد نماذج
(LLM) إلى OpenClaw. في النهاية، سيكون لديك مزوّد يحتوي على كتالوج نماذج،
ومصادقة بمفتاح API، وحل ديناميكي للنماذج.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا لمعرفة بنية
  الحزمة الأساسية وإعداد البيان.
</Info>

<Tip>
  تضيف Plugins المزوّدين نماذج إلى حلقة الاستدلال العادية في OpenClaw. إذا كان النموذج
  يجب أن يعمل عبر daemon وكيل أصلي يملك الخيوط، وCompaction، أو أحداث الأدوات،
  فاربط المزوّد مع [حاضنة وكيل](/ar/plugins/sdk-agent-harness)
  بدلًا من وضع تفاصيل بروتوكول الـ daemon في النواة.
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

    يعرّف البيان `providerAuthEnvVars` بحيث يتمكن OpenClaw من اكتشاف
    بيانات الاعتماد دون تحميل وقت تشغيل Plugin الخاص بك. أضف `providerAuthAliases`
    عندما يجب أن يعيد أحد أشكال المزوّد استخدام مصادقة معرّف مزوّد آخر. يعد `modelSupport`
    اختياريًا، ويسمح لـ OpenClaw بتحميل Plugin المزوّد تلقائيًا من
    معرّفات النماذج المختصرة مثل `acme-large` قبل وجود وسائط ربط وقت التشغيل. إذا نشرت
    المزوّد على ClawHub، فإن حقول `openclaw.compat` و `openclaw.build`
    مطلوبة في `package.json`.

  </Step>

  <Step title="تسجيل المزوّد">
    يحتاج الحد الأدنى من المزوّد إلى `id` و`label` و`auth` و`catalog`:

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

    هذا مزوّد يعمل بالفعل. يمكن للمستخدمين الآن
    `openclaw onboard --acme-ai-api-key <key>` ثم اختيار
    `acme-ai/acme-large` كنموذج لهم.

    إذا كان المزوّد upstream يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
    تحويلًا نصيًا صغيرًا ثنائي الاتجاه بدلًا من استبدال مسار التدفق:

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

    يعيد `input` كتابة مطالبة النظام النهائية ومحتوى الرسائل النصية قبل
    النقل. ويعيد `output` كتابة دلتا نصوص المساعد والنص النهائي قبل
    أن يحلل OpenClaw علامات التحكم الخاصة به أو تسليم القنوات.

    بالنسبة إلى المزوّدين المضمّنين الذين يسجلون فقط مزوّد نص واحدًا بمصادقة
    مفتاح API بالإضافة إلى وقت تشغيل واحد مدعوم بكتالوج، ففضّل
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

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى تعديل `models.providers.*`، والأسماء المستعارة،
    والنموذج الافتراضي للوكيل أثناء onboard، فاستخدم مساعدات الإعداد المسبق من
    `openclaw/plugin-sdk/provider-onboard`. أضيق هذه المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية الخاصة بمزوّد ما كتل استخدام متدفقة على
    نقل `openai-completions` العادي، ففضّل مساعدات الكتالوج المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من ترميز عمليات تحقق
    معرّف المزوّد بشكل صلب. تقوم
    `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` باكتشاف الدعم من خريطة قدرات
    نقطة النهاية، بحيث تظل نقاط النهاية الأصلية على نمط Moonshot/DashScope
    منضمّة حتى عندما يستخدم Plugin معرّف مزوّدًا مخصصًا.

  </Step>

  <Step title="إضافة حل ديناميكي للنموذج">
    إذا كان مزوّدك يقبل معرّفات نماذج عشوائية (مثل proxy أو router)،
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

    إذا كان الحل يتطلب استدعاءً للشبكة، فاستخدم `prepareDynamicModel` من أجل
    الإحماء غير المتزامن — يتم تشغيل `resolveDynamicModel` مرة أخرى بعد اكتماله.

  </Step>

  <Step title="إضافة وسائط ربط وقت التشغيل (عند الحاجة)">
    لا تحتاج معظم المزوّدات إلا إلى `catalog` و`resolveDynamicModel`. أضف الوسائط
    تدريجيًا بحسب ما يتطلبه مزوّدك.

    تغطي أدوات البناء المساعدة المشتركة الآن أكثر عائلات إعادة التشغيل/توافق الأدوات
    شيوعًا، لذلك لا تحتاج Plugins عادةً إلى توصيل كل وسيط ربط يدويًا واحدًا تلو الآخر:

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

    عائلات إعادة التشغيل المتاحة اليوم:

    | العائلة | ما الذي توصله |
    | --- | --- |
    | `openai-compatible` | سياسة إعادة تشغيل مشتركة على نمط OpenAI لعمليات النقل المتوافقة مع OpenAI، بما في ذلك تنقية tool-call-id، وإصلاحات ترتيب assistant-first، والتحقق العام من أدوار Gemini عندما يحتاج النقل إلى ذلك |
    | `anthropic-by-model` | سياسة إعادة تشغيل مدركة لـ Claude يتم اختيارها بواسطة `modelId`، بحيث لا تحصل عمليات نقل رسائل Anthropic على تنظيف كتل التفكير الخاصة بـ Claude إلا عندما يكون النموذج الذي تم حله في الواقع معرّف Claude |
    | `google-gemini` | سياسة إعادة تشغيل Gemini الأصلية بالإضافة إلى تنقية إعادة التشغيل الابتدائية ووضع إخراج الاستدلال الموسوم |
    | `passthrough-gemini` | تنقية thought-signature الخاصة بـ Gemini للنماذج التي تعمل عبر عمليات نقل proxy متوافقة مع OpenAI؛ ولا يفعّل التحقق الأصلي من إعادة تشغيل Gemini أو إعادة كتابة التهيئة الابتدائية |
    | `hybrid-anthropic-openai` | سياسة هجينة للمزوّدين الذين يخلطون بين أسطح نماذج رسائل Anthropic والأسطح المتوافقة مع OpenAI داخل Plugin واحد؛ ويظل إسقاط كتل التفكير الاختياري الخاصة بـ Claude محصورًا في جانب Anthropic |

    أمثلة حقيقية مضمّنة:

    - `google` و`google-gemini-cli`: ‏`google-gemini`
    - `openrouter` و`kilocode` و`opencode` و`opencode-go`: ‏`passthrough-gemini`
    - `amazon-bedrock` و`anthropic-vertex`: ‏`anthropic-by-model`
    - `minimax`: ‏`hybrid-anthropic-openai`
    - `moonshot` و`ollama` و`xai` و`zai`: ‏`openai-compatible`

    عائلات التدفق المتاحة اليوم:

    | العائلة | ما الذي توصله |
    | --- | --- |
    | `google-thinking` | تطبيع حمولة التفكير الخاصة بـ Gemini على مسار التدفق المشترك |
    | `kilocode-thinking` | غلاف الاستدلال الخاص بـ Kilo على مسار تدفق proxy المشترك، مع تخطي `kilo/auto` ومعرّفات الاستدلال غير المدعومة للـ proxy لحقن التفكير |
    | `moonshot-thinking` | تعيين حمولة native-thinking الثنائية الخاصة بـ Moonshot انطلاقًا من الإعداد + مستوى `/think` |
    | `minimax-fast-mode` | إعادة كتابة نموذج الوضع السريع لـ MiniMax على مسار التدفق المشترك |
    | `openai-responses-defaults` | أغلفة Responses الأصلية المشتركة لـ OpenAI/Codex: رؤوس الإسناد، و`/fast`/`serviceTier`، ودرجة إسهاب النص، والبحث الأصلي على الويب في Codex، وتشكيل حمولة توافق الاستدلال، وإدارة سياق Responses |
    | `openrouter-thinking` | غلاف الاستدلال الخاص بـ OpenRouter لمسارات proxy، مع التعامل مركزيًا مع تخطي النماذج غير المدعومة/`auto` |
    | `tool-stream-default-on` | غلاف `tool_stream` مفعّل افتراضيًا لمزوّدين مثل Z.AI الذين يريدون تدفق الأدوات ما لم يتم تعطيله صراحةً |

    أمثلة حقيقية مضمّنة:

    - `google` و`google-gemini-cli`: ‏`google-thinking`
    - `kilocode`: ‏`kilocode-thinking`
    - `moonshot`: ‏`moonshot-thinking`
    - `minimax` و`minimax-portal`: ‏`minimax-fast-mode`
    - `openai` و`openai-codex`: ‏`openai-responses-defaults`
    - `openrouter`: ‏`openrouter-thinking`
    - `zai`: ‏`tool-stream-default-on`

    يصدّر `openclaw/plugin-sdk/provider-model-shared` أيضًا تعداد
    عائلات إعادة التشغيل بالإضافة إلى المساعدات المشتركة التي تُبنى منها تلك العائلات. ومن
    الصادرات العامة الشائعة:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - أدوات بناء إعادة التشغيل المشتركة مثل `buildOpenAICompatibleReplayPolicy(...)`،
      و`buildAnthropicReplayPolicyForModel(...)`،
      و`buildGoogleGeminiReplayPolicy(...)`، و
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - مساعدات إعادة تشغيل Gemini مثل `sanitizeGoogleGeminiReplayHistory(...)`
      و`resolveTaggedReasoningOutputMode()`
    - مساعدات نقطة النهاية/النموذج مثل `resolveProviderEndpoint(...)`،
      و`normalizeProviderId(...)`، و`normalizeGooglePreviewModelId(...)`، و
      `normalizeNativeXaiModelId(...)`

    يوفّر `openclaw/plugin-sdk/provider-stream` كلًا من أداة بناء العائلة
    ومساعدات الأغلفة العامة التي تعيد تلك العائلات استخدامها. وتشمل
    الصادرات العامة الشائعة:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - أغلفة OpenAI/Codex المشتركة مثل
      `createOpenAIAttributionHeadersWrapper(...)`،
      و`createOpenAIFastModeWrapper(...)`،
      و`createOpenAIServiceTierWrapper(...)`,
      و`createOpenAIResponsesContextManagementWrapper(...)`، و
      `createCodexNativeWebSearchWrapper(...)`
    - أغلفة proxy/المزوّد المشتركة مثل `createOpenRouterWrapper(...)`،
      و`createToolStreamWrapper(...)`، و`createMinimaxFastModeWrapper(...)`

    تبقى بعض مساعدات التدفق محلية للمزوّد عمدًا. المثال المضمّن الحالي:
    يصدّر `@openclaw/anthropic-provider`
    `wrapAnthropicProviderStream`، و`resolveAnthropicBetas`،
    و`resolveAnthropicFastMode`، و`resolveAnthropicServiceTier`، و
    أدوات بناء الأغلفة الأدنى مستوى الخاصة بـ Anthropic من واجهة `api.ts` /
    `contract-api.ts` العامة الخاصة به. تظل هذه المساعدات خاصة بـ Anthropic لأن
    ترمّز أيضًا التعامل مع Claude OAuth beta وضبط `context1m`.

    تحتفظ مزوّدات مضمّنة أخرى أيضًا بأغلفة خاصة بالنقل محليًا عندما
    لا يكون السلوك مشتركًا بصورة نظيفة بين العائلات. المثال الحالي: يحتفظ
    Plugin ‏xAI المضمّن بتشكيل Responses الأصلي الخاص بـ xAI داخل
    `wrapStreamFn` الخاص به، بما في ذلك إعادة كتابة الأسماء المستعارة لـ `/fast`،
    و`tool_stream` الافتراضي، وتنظيف الأدوات الصارمة غير المدعومة، وإزالة
    حمولة الاستدلال الخاصة بـ xAI.

    يكشف `openclaw/plugin-sdk/provider-tools` حاليًا عن عائلة مشتركة واحدة
    لمخططات الأدوات بالإضافة إلى مساعدات المخطط/التوافق المشتركة:

    - يوضّح `ProviderToolCompatFamily` قائمة العائلات المشتركة الحالية.
    - يقوم `buildProviderToolCompatFamilyHooks("gemini")` بتوصيل
      تنظيف مخطط Gemini + التشخيصات للمزوّدين الذين يحتاجون إلى مخططات أدوات آمنة مع Gemini.
    - `normalizeGeminiToolSchemas(...)` و`inspectGeminiToolSchemas(...)`
      هما مساعدا مخطط Gemini العامّان الأساسيان.
    - يعيد `resolveXaiModelCompatPatch()` تصحيح التوافق المضمّن الخاص بـ xAI:
      `toolSchemaProfile: "xai"`، وكلمات مخطط أساسية غير مدعومة، ودعم
      `web_search` الأصلي، وفك ترميز وسائط استدعاء الأدوات بكيانات HTML.
    - يطبّق `applyXaiModelCompat(model)` تصحيح توافق xAI نفسه على
      نموذج تم حله قبل أن يصل إلى المشغّل.

    مثال حقيقي مضمّن: يستخدم Plugin ‏xAI كلًا من `normalizeResolvedModel` و
    `contributeResolvedModelCompat` للإبقاء على بيانات التوافق الوصفية هذه
    مملوكة للمزوّد بدلًا من ترميز قواعد xAI بشكل صلب داخل النواة.

    ويدعم نمط جذر الحزمة نفسه أيضًا مزوّدات مضمّنة أخرى:

    - `@openclaw/openai-provider`: يصدّر `api.ts` أدوات بناء المزوّد،
      ومساعدات النموذج الافتراضي، وأدوات بناء المزوّدات اللحظية
    - `@openclaw/openrouter-provider`: يصدّر `api.ts` أداة بناء المزوّد
      بالإضافة إلى مساعدات onboard/config

    <Tabs>
      <Tab title="تبادل الرموز المميّزة">
        بالنسبة إلى المزوّدين الذين يحتاجون إلى تبادل رمز مميّز قبل كل استدعاء استدلال:

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
        بالنسبة إلى المزوّدين الذين يحتاجون إلى رؤوس طلبات مخصصة أو تعديلات على جسم الطلب:

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
        بالنسبة إلى المزوّدين الذين يحتاجون إلى رؤوس طلب/جلسة أصلية أو بيانات وصفية على
        عمليات نقل HTTP أو WebSocket العامة:

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
        بالنسبة إلى المزوّدين الذين يوفّرون بيانات الاستخدام/الفوترة:

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

    <Accordion title="جميع وسائط ربط المزوّد المتاحة">
      يستدعي OpenClaw وسائط الربط بهذا الترتيب. تستخدم معظم المزوّدات 2-3 فقط:

      | # | وسيط الربط | متى يُستخدم |
      | --- | --- | --- |
      | 1 | `catalog` | كتالوج النماذج أو القيم الافتراضية لـ base URL |
      | 2 | `applyConfigDefaults` | القيم الافتراضية العامة المملوكة للمزوّد أثناء تجسيد config |
      | 3 | `normalizeModelId` | تنظيف الأسماء المستعارة القديمة/المعاينة لمعرّف النموذج قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` الخاص بعائلة المزوّد قبل التجميع العام للنموذج |
      | 5 | `normalizeConfig` | تطبيع config الخاص بـ `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق الاستخدام المتدفق الأصلي لمزوّدات config |
      | 7 | `resolveConfigApiKey` | حل مصادقة env-marker المملوكة للمزوّد |
      | 8 | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/مستضافة ذاتيًا أو مدعومة بـ config |
      | 9 | `shouldDeferSyntheticProfileAuth` | خفض أولوية العناصر النائبة للملفات الشخصية الاصطناعية المخزنة خلف مصادقة env/config |
      | 10 | `resolveDynamicModel` | قبول معرّفات نماذج upstream عشوائية |
      | 11 | `prepareDynamicModel` | جلب بيانات وصفية غير متزامن قبل الحل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المشغّل |

    ملاحظات احتياطية لوقت التشغيل:

    - يتحقق `normalizeConfig` من المزوّد المطابق أولًا، ثم من Plugins المزوّد الأخرى
      القادرة على استخدام وسائط الربط إلى أن يغيّر أحدها config بالفعل.
      وإذا لم تعِد كتابة أي من وسائط ربط المزوّد إدخال config مدعومًا لعائلة Google،
      فسيظل مطبّع config المضمّن الخاص بـ Google مطبقًا.
    - يستخدم `resolveConfigApiKey` وسيط ربط المزوّد عندما يكون مكشوفًا. كما أن
      المسار المضمّن لـ `amazon-bedrock` يحتوي هنا أيضًا على محلّل env-marker
      مضمّن خاص بـ AWS، رغم أن مصادقة وقت تشغيل Bedrock نفسها لا تزال تستخدم
      سلسلة AWS SDK الافتراضية.
      | 13 | `contributeResolvedModelCompat` | إشارات توافق لنماذج المورّدين خلف نقل متوافق آخر |
      | 14 | `capabilities` | حزمة قدرات ثابتة قديمة؛ للتوافق فقط |
      | 15 | `normalizeToolSchemas` | تنظيف مخططات الأدوات المملوك للمزوّد قبل التسجيل |
      | 16 | `inspectToolSchemas` | تشخيصات مخططات الأدوات المملوكة للمزوّد |
      | 17 | `resolveReasoningOutputMode` | عقد إخراج الاستدلال بين الموسوم والأصلي |
      | 18 | `prepareExtraParams` | معلمات الطلب الافتراضية |
      | 19 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 20 | `wrapStreamFn` | أغلفة رؤوس/أجسام مخصصة على مسار التدفق العادي |
      | 21 | `resolveTransportTurnState` | رؤوس/بيانات وصفية أصلية لكل دور |
      | 22 | `resolveWebSocketSessionPolicy` | رؤوس جلسة WS الأصلية/فترة التهدئة |
      | 23 | `formatApiKey` | شكل رمز وقت تشغيل مخصص |
      | 24 | `refreshOAuth` | تحديث OAuth مخصص |
      | 25 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 26 | `matchesContextOverflowError` | اكتشاف تجاوز السعة المملوك للمزوّد |
      | 27 | `classifyFailoverReason` | تصنيف مملوك للمزوّد لحد المعدّل/زيادة الحمل |
      | 28 | `isCacheTtlEligible` | ضبط أهلية TTL لذاكرة التخزين المؤقت للمطالبة |
      | 29 | `buildMissingAuthMessage` | تلميح مخصص عند غياب المصادقة |
      | 30 | `suppressBuiltInModel` | إخفاء الصفوف القديمة من upstream |
      | 31 | `augmentModelCatalog` | صفوف اصطناعية لتوافق مستقبلي |
      | 32 | `resolveThinkingProfile` | مجموعة خيارات `/think` خاصة بالنموذج |
      | 33 | `isBinaryThinking` | توافق تشغيل/إيقاف التفكير الثنائي |
      | 34 | `supportsXHighThinking` | توافق دعم الاستدلال `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 36 | `isModernModelRef` | مطابقة النموذج المباشر/الاختبار الدخاني |
      | 37 | `prepareRuntimeAuth` | تبادل رمز مميّز قبل الاستدلال |
      | 38 | `resolveUsageAuth` | تحليل بيانات اعتماد الاستخدام المخصص |
      | 39 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 40 | `createEmbeddingProvider` | موائم embeddings مملوك للمزوّد للذاكرة/البحث |
      | 41 | `buildReplayPolicy` | سياسة مخصصة لإعادة تشغيل/Compaction النصوص |
      | 42 | `sanitizeReplayHistory` | إعادة كتابة خاصة بالمزوّد لسجل إعادة التشغيل بعد التنظيف العام |
      | 43 | `validateReplayTurns` | تحقق صارم من أدوار إعادة التشغيل قبل المشغّل المضمّن |
      | 44 | `onModelSelected` | رد نداء بعد اختيار النموذج (مثل telemetry) |

      ملاحظة حول ضبط المطالبة:

      - يتيح `resolveSystemPromptContribution` لمزوّد ما حقن
        إرشادات مطالبة نظام مدركة للذاكرة المؤقتة لعائلة نماذج. فضّله بدلًا من
        `before_prompt_build` عندما يكون السلوك تابعًا لمزوّد/عائلة نماذج واحدة
        ويجب أن يحافظ على الفصل المستقر/الديناميكي للذاكرة المؤقتة.

      للحصول على أوصاف تفصيلية وأمثلة واقعية، انظر
      [الداخليات: وسائط ربط وقت تشغيل المزوّد](/ar/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="إضافة قدرات إضافية (اختياري)">
    <a id="step-5-add-extra-capabilities"></a>
    يمكن لـ Plugin المزوّد تسجيل الكلام، والنسخ اللحظي،
    والصوت اللحظي، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب،
    والبحث على الويب إلى جانب استدلال النص:

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
        hint: "اجلب الصفحات عبر الواجهة الخلفية الخاصة بالعرض في Acme.",
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
          description: "اجلب صفحة عبر Acme Fetch.",
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
    النمط الموصى به لـ Plugins الشركات (Plugin واحد لكل مورّد). انظر
    [الداخليات: ملكية القدرات](/ar/plugins/architecture#capability-ownership-model).

    بالنسبة إلى توليد الفيديو، ففضّل بنية القدرات الواعية بالأوضاع الموضحة أعلاه:
    `generate`، و`imageToVideo`، و`videoToVideo`. الحقول التجميعية المسطحة مثل
    `maxInputImages`، و`maxInputVideos`، و`maxDurationSeconds` ليست
    كافية للإعلان بوضوح عن دعم أوضاع التحويل أو الأوضاع المعطلة.

    يجب أن تتبع مزوّدات توليد الموسيقى النمط نفسه:
    `generate` للتوليد المعتمد على المطالبة فقط، و`edit` للتوليد المعتمد على صورة مرجعية.
    الحقول التجميعية المسطحة مثل `maxInputImages`،
    و`supportsLyrics`، و`supportsFormat` ليست كافية للإعلان عن دعم
    التحرير؛ إذ إن كتل `generate` / `edit` الصريحة هي العقد المتوقع.

  </Step>

  <Step title="الاختبار">
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

تُنشر Plugins المزوّدين بالطريقة نفسها مثل أي Plugin برمجي خارجي آخر:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم هنا الاسم المستعار القديم للنشر الخاص بالـ Skills فقط؛ يجب أن تستخدم
حزم Plugins الأمر `clawhub package publish`.

## بنية الملفات

```
<bundled-plugin-root>/acme-ai/
├── package.json              # بيانات openclaw.providers الوصفية
├── openclaw.plugin.json      # بيان مع بيانات وصفية لمصادقة المزوّد
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # الاختبارات
    └── usage.ts              # نقطة نهاية الاستخدام (اختياري)
```

## مرجع ترتيب الكتالوج

يتحكم `catalog.order` في وقت دمج كتالوجك بالنسبة إلى
المزوّدين المضمّنين:

| الترتيب | متى | حالة الاستخدام |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | المرور الأول    | مزوّدات مفاتيح API البسيطة                         |
| `profile` | بعد simple  | مزوّدات محكومة بملفات تعريف المصادقة                |
| `paired`  | بعد profile | توليد عدة إدخالات مرتبطة             |
| `late`    | المرور الأخير     | تجاوز المزوّدين الموجودين (يفوز عند التعارض) |

## الخطوات التالية

- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — إذا كان Plugin الخاص بك يوفّر قناة أيضًا
- [SDK Runtime](/ar/plugins/sdk-runtime) — مساعدات `api.runtime` ‏(TTS، والبحث، والوكيل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل لواردات المسارات الفرعية
- [داخليات Plugin](/ar/plugins/architecture#provider-runtime-hooks) — تفاصيل وسائط الربط والأمثلة المضمّنة
