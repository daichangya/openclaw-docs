---
read_when:
    - أنت تبني Plugin مزوّد نماذج جديدًا
    - تريد إضافة proxy متوافق مع OpenAI أو LLM مخصص إلى OpenClaw
    - أنت بحاجة إلى فهم مصادقة المزوّد، والكتالوجات، وخطافات وقت التشغيل
sidebarTitle: Provider plugins
summary: دليل خطوة بخطوة لبناء Plugin مزوّد نماذج لـ OpenClaw
title: بناء Plugins المزوّد
x-i18n:
    generated_at: "2026-04-25T13:54:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

يرشدك هذا الدليل خلال بناء Plugin مزوّد يضيف مزوّد نماذج
(LLM) إلى OpenClaw. وبنهاية الدليل سيكون لديك مزوّد يملك كتالوج نماذج،
ومصادقة بمفتاح API، وتحليلًا ديناميكيًا للنماذج.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا لمعرفة البنية الأساسية
  للحزمة وإعداد manifest.
</Info>

<Tip>
  تضيف Plugins المزوّد نماذج إلى حلقة الاستدلال العادية في OpenClaw. وإذا كان النموذج
  يجب أن يعمل عبر daemon وكيل أصلي يملك threads وCompaction أو أحداث
  الأدوات، فاقرن المزوّد مع [حزام وكيل](/ar/plugins/sdk-agent-harness)
  بدلًا من وضع تفاصيل بروتوكول daemon في النواة.
</Tip>

## الدليل العملي

<Steps>
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

    يعلن manifest عن `providerAuthEnvVars` حتى يتمكن OpenClaw من اكتشاف
    بيانات الاعتماد من دون تحميل وقت تشغيل Plugin لديك. وأضف `providerAuthAliases`
    عندما ينبغي لمتغير مزوّد أن يعيد استخدام مصادقة معرّف مزوّد آخر. ويكون `modelSupport`
    اختياريًا ويسمح لـ OpenClaw بتحميل Plugin المزوّد لديك تلقائيًا من
    معرّفات نماذج مختصرة مثل `acme-large` قبل وجود خطافات وقت التشغيل. وإذا كنت تنشر
    المزوّد على ClawHub، فإن حقول `openclaw.compat` و`openclaw.build`
    هذه تكون مطلوبة في `package.json`.

  </Step>

  <Step title="سجّل المزوّد">
    يحتاج المزوّد الأدنى إلى `id`، و`label`، و`auth`، و`catalog`:

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

    هذا مزوّد عامل. ويمكن للمستخدمين الآن
    `openclaw onboard --acme-ai-api-key <key>` ثم اختيار
    `acme-ai/acme-large` كنموذج لهم.

    إذا كان المزوّد الأعلى يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
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

    يعيد `input` كتابة مطالبة النظام النهائية ومحتوى الرسائل النصية قبل
    النقل. ويعيد `output` كتابة دفعات نص المساعد والنص النهائي قبل
    أن يحلل OpenClaw علامات التحكم الخاصة به أو تسليم القناة.

    بالنسبة إلى المزوّدين المضمّنين الذين يسجّلون مزوّد نص واحدًا فقط مع مصادقة
    بمفتاح API بالإضافة إلى وقت تشغيل واحد مدعوم بكتالوج، ففضّل
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

    إن `buildProvider` هو مسار الكتالوج الحي المستخدم عندما يستطيع OpenClaw تحليل
    مصادقة مزوّد حقيقية. وقد ينفذ اكتشافًا خاصًا بالمزوّد. أما
    `buildStaticProvider` فلا تستخدمه إلا للصفوف غير المتصلة الآمنة للعرض قبل ضبط المصادقة؛
    ويجب ألا يتطلب بيانات اعتماد أو يجري طلبات شبكة.
    ويقوم عرض `models list --all` في OpenClaw حاليًا بتنفيذ الكتالوجات الثابتة
    فقط لمزودي Plugins المضمّنين، مع إعدادات فارغة، وبيئة فارغة، ومن دون
    مسارات وكيل/مساحة عمل.

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى ترقية `models.providers.*`،
    والأسماء المستعارة، والنموذج الافتراضي للوكيل أثناء الإعداد الأولي، فاستخدم
    مساعدات presets من
    `openclaw/plugin-sdk/provider-onboard`. وأضيق المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية الخاصة بالمزوّد كتل الاستخدام المتدفقة على
    نقل `openai-completions` العادي، ففضّل مساعدات الكتالوج المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من ترميز فحوصات
    معرّف المزوّد مباشرة. إذ إن `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` يكتشفان الدعم من خريطة إمكانات
    نقطة النهاية، بحيث تبقى نقاط النهاية الأصلية بنمط Moonshot/DashScope قادرة على
    الاشتراك حتى عندما يستخدم Plugin معرّف مزوّد مخصصًا.

  </Step>

  <Step title="أضف تحليل النماذج الديناميكي">
    إذا كان مزوّدك يقبل معرّفات نماذج اعتباطية (مثل proxy أو router)،
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

    وإذا كان التحليل يتطلب استدعاء شبكة، فاستخدم `prepareDynamicModel` من أجل
    الإحماء غير المتزامن — ثم يعمل `resolveDynamicModel` مرة أخرى بعد اكتماله.

  </Step>

  <Step title="أضف خطافات وقت التشغيل (عند الحاجة)">
    لا يحتاج معظم المزوّدين إلا إلى `catalog` + `resolveDynamicModel`. وأضف الخطافات
    تدريجيًا بحسب ما يتطلبه مزوّدك.

    تغطي مساعدات البناء المشتركة الآن عائلات replay/tool-compat الأكثر شيوعًا،
    لذلك لا تحتاج Plugins عادةً إلى توصيل كل خطاف يدويًا واحدًا واحدًا:

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

    عائلات replay المتاحة اليوم:

    | العائلة | ما الذي توصّله | أمثلة مضمّنة |
    | --- | --- | --- |
    | `openai-compatible` | سياسة replay مشتركة بنمط OpenAI لعمليات النقل المتوافقة مع OpenAI، بما في ذلك تنظيف `tool-call-id`، وإصلاحات ترتيب assistant-first، والتحقق العام من دور Gemini عندما يحتاج النقل إلى ذلك | `moonshot`، و`ollama`، و`xai`، و`zai` |
    | `anthropic-by-model` | سياسة replay مدركة لـ Claude تُختار بحسب `modelId`، بحيث لا تحصل عمليات النقل برسائل Anthropic على تنظيف كتل التفكير الخاصة بـ Claude إلا عندما يكون النموذج المحلول بالفعل معرّف Claude | `amazon-bedrock`، و`anthropic-vertex` |
    | `google-gemini` | سياسة replay أصلية لـ Gemini بالإضافة إلى تنظيف replay عند التهيئة ووضع مخرجات reasoning الموسومة | `google`، و`google-gemini-cli` |
    | `passthrough-gemini` | تنظيف thought-signature في Gemini للنماذج العاملة عبر عمليات نقل proxy المتوافقة مع OpenAI؛ ولا يفعّل التحقق الأصلي من replay الخاص بـ Gemini أو إعادة كتابة التهيئة | `openrouter`، و`kilocode`، و`opencode`، و`opencode-go` |
    | `hybrid-anthropic-openai` | سياسة هجينة للمزوّدين الذين يخلطون بين أسطح نماذج رسائل Anthropic والأسطح المتوافقة مع OpenAI في Plugin واحد؛ ويظل إسقاط كتل التفكير الخاصة بـ Claude والمخصص اختياريًا محصورًا في جانب Anthropic | `minimax` |

    عائلات البث المتاحة اليوم:

    | العائلة | ما الذي توصّله | أمثلة مضمّنة |
    | --- | --- | --- |
    | `google-thinking` | تطبيع حمولة thinking الخاصة بـ Gemini على مسار البث المشترك | `google`، و`google-gemini-cli` |
    | `kilocode-thinking` | غلاف reasoning الخاص بـ Kilo على مسار البث المشترك عبر proxy، مع تخطي `kilo/auto` ومعرّفات reasoning غير المدعومة عبر proxy لعملية حقن thinking | `kilocode` |
    | `moonshot-thinking` | ربط حمولة native-thinking الثنائية الخاصة بـ Moonshot انطلاقًا من الإعدادات ومستوى `/think` | `moonshot` |
    | `minimax-fast-mode` | إعادة كتابة نموذج fast-mode الخاص بـ MiniMax على مسار البث المشترك | `minimax`، و`minimax-portal` |
    | `openai-responses-defaults` | أغلفة OpenAI/Codex Responses الأصلية المشتركة: ترويسات الإسناد، و`/fast`/`serviceTier`، ودرجة تفصيل النص، وبحث الويب الأصلي في Codex، وتشكيل حمولة reasoning-compat، وإدارة سياق Responses | `openai`، و`openai-codex` |
    | `openrouter-thinking` | غلاف reasoning الخاص بـ OpenRouter لمسارات proxy، مع التعامل مركزيًا مع تخطي النماذج غير المدعومة/`auto` | `openrouter` |
    | `tool-stream-default-on` | غلاف `tool_stream` مفعّل افتراضيًا لمزوّدين مثل Z.AI يريدون بث الأدوات ما لم يُعطَّل صراحةً | `zai` |

    <Accordion title="وصلات SDK التي تشغّل بانيات العائلات">
      يتكوّن كل بانٍ للعائلات من مساعدات عامة منخفضة المستوى مُصدَّرة من الحزمة نفسها، ويمكنك اللجوء إليها عندما يحتاج المزوّد إلى الخروج عن النمط الشائع:

      - `openclaw/plugin-sdk/provider-model-shared` — ‏`ProviderReplayFamily`، و`buildProviderReplayFamilyHooks(...)`، وبانيات replay الخام (`buildOpenAICompatibleReplayPolicy`، و`buildAnthropicReplayPolicyForModel`، و`buildGoogleGeminiReplayPolicy`، و`buildHybridAnthropicOrOpenAIReplayPolicy`). كما يصدّر مساعدات replay الخاصة بـ Gemini (`sanitizeGoogleGeminiReplayHistory`، و`resolveTaggedReasoningOutputMode`) ومساعدات نقطة النهاية/النموذج (`resolveProviderEndpoint`، و`normalizeProviderId`، و`normalizeGooglePreviewModelId`، و`normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — ‏`ProviderStreamFamily`، و`buildProviderStreamFamilyHooks(...)`، و`composeProviderStreamWrappers(...)`، بالإضافة إلى أغلفة OpenAI/Codex المشتركة (`createOpenAIAttributionHeadersWrapper`، و`createOpenAIFastModeWrapper`، و`createOpenAIServiceTierWrapper`، و`createOpenAIResponsesContextManagementWrapper`، و`createCodexNativeWebSearchWrapper`) وأغلفة proxy/provider المشتركة (`createOpenRouterWrapper`، و`createToolStreamWrapper`، و`createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — ‏`ProviderToolCompatFamily`، و`buildProviderToolCompatFamilyHooks("gemini")`، ومساعدات مخطط Gemini الأساسية (`normalizeGeminiToolSchemas`، و`inspectGeminiToolSchemas`) ومساعدات التوافق الخاصة بـ xAI (`resolveXaiModelCompatPatch()`، و`applyXaiModelCompat(model)`). ويستخدم Plugin ‏xAI المضمّن `normalizeResolvedModel` + `contributeResolvedModelCompat` مع هذه الأدوات حتى تبقى قواعد xAI مملوكة للمزوّد.

      تبقى بعض مساعدات البث محلية للمزوّد عمدًا. إذ يحتفظ `@openclaw/anthropic-provider` بالدوال `wrapAnthropicProviderStream`، و`resolveAnthropicBetas`، و`resolveAnthropicFastMode`، و`resolveAnthropicServiceTier`، وبانيات أغلفة Anthropic منخفضة المستوى داخل وصلة `api.ts` / `contract-api.ts` العامة الخاصة به لأنه يشفّر معالجة Claude OAuth beta وتقييد `context1m`. وبالمثل، يحتفظ Plugin ‏xAI بتشكيل Responses الأصلي الخاص بـ xAI داخل `wrapStreamFn` الخاص به (`/fast` aliases، و`tool_stream` الافتراضي، وتنظيف strict-tool غير المدعوم، وإزالة حمولة reasoning الخاصة بـ xAI).

      كما يدعم نمط جذر الحزمة نفسه أيضًا `@openclaw/openai-provider` (بانيات المزوّد، ومساعدات النموذج الافتراضي، وبانيات مزوّد realtime) و`@openclaw/openrouter-provider` (بانٍ للمزوّد بالإضافة إلى مساعدات onboarding/config).
    </Accordion>

    <Tabs>
      <Tab title="تبادل token">
        بالنسبة إلى المزوّدين الذين يحتاجون إلى تبادل token قبل كل استدعاء استدلال:

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
        بالنسبة إلى المزوّدين الذين يحتاجون إلى ترويسات طلب مخصصة أو تعديلات على الجسم:

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
        بالنسبة إلى المزوّدين الذين يحتاجون إلى ترويسات أو بيانات تعريف أصلية للطلب/الجلسة على
        عمليات النقل العامة عبر HTTP أو WebSocket:

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
        بالنسبة إلى المزوّدين الذين يعرّضون بيانات الاستخدام/الفوترة:

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

    <Accordion title="كل خطافات المزوّد المتاحة">
      يستدعي OpenClaw الخطافات بهذا الترتيب. ولا يستخدم معظم المزوّدين إلا 2-3 منها:

      | # | الخطاف | متى يُستخدم |
      | --- | --- | --- |
      | 1 | `catalog` | كتالوج النماذج أو الإعدادات الافتراضية لـ base URL |
      | 2 | `applyConfigDefaults` | إعدادات افتراضية عامة يملكها المزوّد أثناء تشكيل config |
      | 3 | `normalizeModelId` | تنظيف الأسماء المستعارة القديمة/معرّفات النماذج التجريبية قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة المزوّد قبل التجميع العام للنموذج |
      | 5 | `normalizeConfig` | تطبيع إعدادات `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق streaming-usage الأصلي لمزوّدي config |
      | 7 | `resolveConfigApiKey` | تحليل مصادقة env-marker المملوك للمزوّد |
      | 8 | `resolveSyntheticAuth` | مصادقة اصطناعية محلية/مستضافة ذاتيًا أو مدعومة بالإعدادات |
      | 9 | `shouldDeferSyntheticProfileAuth` | خفض أولوية العناصر الاصطناعية النائبة لملفات التعريف المخزنة خلف مصادقة env/config |
      | 10 | `resolveDynamicModel` | قبول معرّفات النماذج الاعتباطية من المصدر الأعلى |
      | 11 | `prepareDynamicModel` | جلب بيانات تعريف غير متزامن قبل التحليل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المنفّذ |
      | 13 | `contributeResolvedModelCompat` | رايات توافق لنماذج مورّد تعمل خلف نقل متوافق آخر |
      | 14 | `capabilities` | حقيبة إمكانات ثابتة قديمة؛ للتوافق فقط |
      | 15 | `normalizeToolSchemas` | تنظيف مخططات الأدوات المملوك للمزوّد قبل التسجيل |
      | 16 | `inspectToolSchemas` | تشخيصات مخططات الأدوات المملوكة للمزوّد |
      | 17 | `resolveReasoningOutputMode` | عقد reasoning-output بين tagged وnative |
      | 18 | `prepareExtraParams` | معلمات الطلب الافتراضية |
      | 19 | `createStreamFn` | نقل StreamFn مخصص بالكامل |
      | 20 | `wrapStreamFn` | أغلفة ترويسات/أجسام مخصصة على مسار البث العادي |
      | 21 | `resolveTransportTurnState` | ترويسات/بيانات تعريف أصلية لكل دورة |
      | 22 | `resolveWebSocketSessionPolicy` | ترويسات جلسة WS أصلية/تهدئة |
      | 23 | `formatApiKey` | شكل token مخصص في وقت التشغيل |
      | 24 | `refreshOAuth` | تحديث OAuth مخصص |
      | 25 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 26 | `matchesContextOverflowError` | اكتشاف فائض السياق المملوك للمزوّد |
      | 27 | `classifyFailoverReason` | تصنيف rate-limit/overload المملوك للمزوّد |
      | 28 | `isCacheTtlEligible` | تقييد TTL لذاكرة التخزين المؤقت للمطالبة |
      | 29 | `buildMissingAuthMessage` | تلميح مخصص للمصادقة المفقودة |
      | 30 | `suppressBuiltInModel` | إخفاء الصفوف القديمة من المصدر الأعلى |
      | 31 | `augmentModelCatalog` | صفوف تركيبية للتوافق المستقبلي |
      | 32 | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | 33 | `isBinaryThinking` | توافق thinking الثنائي تشغيل/إيقاف |
      | 34 | `supportsXHighThinking` | توافق دعم reasoning من نوع `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 36 | `isModernModelRef` | مطابقة النماذج الحية/smoke |
      | 37 | `prepareRuntimeAuth` | تبادل token قبل الاستدلال |
      | 38 | `resolveUsageAuth` | تحليل بيانات اعتماد الاستخدام المخصص |
      | 39 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 40 | `createEmbeddingProvider` | محول embedding مملوك للمزوّد للذاكرة/البحث |
      | 41 | `buildReplayPolicy` | سياسة replay/Compaction مخصصة للـ transcript |
      | 42 | `sanitizeReplayHistory` | إعادة كتابة replay خاصة بالمزوّد بعد التنظيف العام |
      | 43 | `validateReplayTurns` | تحقق صارم من دورات replay قبل المنفّذ المضمّن |
      | 44 | `onModelSelected` | نداء لاحق للاختيار (مثل telemetry) |

      ملاحظات الرجوع الاحتياطي لوقت التشغيل:

      - يتحقق `normalizeConfig` من المزوّد المطابق أولًا، ثم من Plugins المزوّد الأخرى القادرة على الخطافات حتى يقوم أحدها فعلًا بتغيير الإعدادات. وإذا لم يُعِد أي خطاف مزوّد كتابة إدخال إعدادات مدعوم لعائلة Google، فإن مطبّع إعدادات Google المضمّن يظل مطبقًا.
      - يستخدم `resolveConfigApiKey` خطاف المزوّد عندما يكون معروضًا. كما أن مسار `amazon-bedrock` المضمّن يملك أيضًا محلّل AWS env-marker مضمّنًا هنا، على الرغم من أن مصادقة وقت تشغيل Bedrock نفسها لا تزال تستخدم السلسلة الافتراضية لـ AWS SDK.
      - يتيح `resolveSystemPromptContribution` لمزوّد ما حقن إرشادات مطالبة نظام تراعي الذاكرة المؤقتة لعائلة نماذج معينة. ويفضّل استخدامه بدلًا من `before_prompt_build` عندما يكون السلوك تابعًا لعائلة مزوّد/نموذج واحدة ويجب أن يحافظ على فصل الذاكرة المؤقتة بين الثابت والديناميكي.

      للحصول على أوصاف مفصلة وأمثلة من الواقع، راجع [الداخليات: خطافات وقت تشغيل المزوّد](/ar/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="أضف إمكانات إضافية (اختياري)">
    يمكن لـ Plugin المزوّد تسجيل قدرات الكلام، والنسخ الفوري، والصوت
    الفوري، وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وجلب الويب،
    والبحث في الويب إلى جانب الاستدلال النصي. ويصنّف OpenClaw هذا على أنه
    Plugin **hybrid-capability** — وهو النمط الموصى به لـ Plugins الشركات
    (Plugin واحد لكل مورّد). راجع
    [الداخليات: ملكية الإمكانات](/ar/plugins/architecture#capability-ownership-model).

    سجّل كل قدرة داخل `register(api)` إلى جانب استدعاء
    `api.registerProvider(...)` الموجود لديك. واختر فقط الألسنة التي تحتاج إليها:

    <Tabs>
      <Tab title="الكلام (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        استخدم `assertOkOrThrowProviderError(...)` لإخفاقات HTTP الخاصة بالمزوّد حتى
        تشترك Plugins في قراءات أجسام الأخطاء المحدودة، وتحليل أخطاء JSON،
        ولواحق request-id.
      </Tab>
      <Tab title="النسخ الفوري">
        فضّل `createRealtimeTranscriptionWebSocketSession(...)` — فالمساعد المشترك
        يتعامل مع التقاط proxy، وتراجع إعادة الاتصال، وتفريغ الإغلاق، ومصافحات الجهوزية،
        ووضع الصوت في الطابور، وتشخيصات أحداث الإغلاق. وكل ما يفعله Plugin لديك
        هو ربط أحداث المصدر الأعلى.

        ```typescript
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
        ```

        يجب على مزوّدي STT الدفعيين الذين يرسلون صوت multipart عبر POST استخدام
        `buildAudioTranscriptionFormData(...)` من
        `openclaw/plugin-sdk/provider-http`. إذ يقوم المساعد بتطبيع
        أسماء ملفات الرفع، بما في ذلك عمليات رفع AAC التي تحتاج إلى اسم ملف
        بنمط M4A من أجل واجهات النسخ المتوافقة.
      </Tab>
      <Tab title="الصوت الفوري">
        ```typescript
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
        ```
      </Tab>
      <Tab title="فهم الوسائط">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="توليد الصور والفيديو">
        تستخدم إمكانات الفيديو شكلًا **واعٍ بالوضع**: `generate`،
        و`imageToVideo`، و`videoToVideo`. أما الحقول التجميعية المسطحة مثل
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` فليست
        كافية للإعلان عن دعم أوضاع التحويل أو الأوضاع المعطلة بشكل نظيف.
        ويتبع توليد الموسيقى النمط نفسه مع كتل `generate` /
        `edit` صريحة.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="جلب الويب والبحث">
        ```typescript
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
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="اختبر">
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

## انشر إلى ClawHub

تُنشر Plugins المزوّد بالطريقة نفسها التي تُنشر بها أي Plugins كود خارجية أخرى:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم الاسم المستعار القديم للنشر الخاص بالـ skill فقط هنا؛ إذ يجب على حزم Plugins استخدام
`clawhub package publish`.

## بنية الملفات

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## مرجع ترتيب الكتالوج

يتحكم `catalog.order` في وقت دمج الكتالوج الخاص بك بالنسبة إلى
المزوّدين المضمّنين:

| الترتيب     | متى          | حالة الاستخدام                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | المرور الأول    | مزوّدو مفاتيح API العاديون                         |
| `profile` | بعد simple  | مزوّدون مقيَّدون بملفات المصادقة الشخصية                |
| `paired`  | بعد profile | توليد إدخالات متعددة مرتبطة ببعضها             |
| `late`    | المرور الأخير     | تجاوز المزوّدين الموجودين (يفوز عند التصادم) |

## الخطوات التالية

- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — إذا كان Plugin لديك يوفّر أيضًا قناة
- [وقت تشغيل SDK](/ar/plugins/sdk-runtime) — مساعدات `api.runtime` (TTS، والبحث، والوكيل الفرعي)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع الاستيراد الكامل للمسارات الفرعية
- [داخليات Plugin](/ar/plugins/architecture-internals#provider-runtime-hooks) — تفاصيل الخطافات والأمثلة المضمّنة

## ذو صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
- [بناء Plugins القنوات](/ar/plugins/sdk-channel-plugins)
