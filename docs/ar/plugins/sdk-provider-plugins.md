---
read_when:
    - أنت تبني Plugin مزوّد نماذج جديدًا
    - تريد إضافة وكيل متوافق مع OpenAI أو LLM مخصص إلى OpenClaw
    - تحتاج إلى فهم مصادقة المزوّد، والفهارس، وخطافات وقت التشغيل
sidebarTitle: Provider Plugins
summary: دليل خطوة بخطوة لبناء Plugin مزوّد نماذج لـ OpenClaw
title: بناء Plugins المزوّدين
x-i18n:
    generated_at: "2026-04-22T04:27:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99376d2abfc968429ed19f03451beb0f3597d57c703f2ce60c6c51220656e850
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# بناء Plugins المزوّدين

يرشدك هذا الدليل خلال بناء Plugin مزوّد يضيف مزوّد نماذج
(LLM) إلى OpenClaw. وبنهاية هذا الدليل سيكون لديك مزوّد مع فهرس نماذج،
ومصادقة بمفتاح API، وحل ديناميكي للنماذج.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا لمعرفة بنية الحزمة
  الأساسية وإعداد البيان.
</Info>

<Tip>
  تضيف Plugins المزوّدين نماذج إلى حلقة الاستدلال العادية في OpenClaw. وإذا كان النموذج
  يجب أن يعمل عبر daemon وكيل أصلي يمتلك السلاسل، أو Compaction، أو أحداث
  الأدوات، فاقرن المزوّد مع [agent harness](/ar/plugins/sdk-agent-harness)
  بدلًا من وضع تفاصيل بروتوكول daemon في Core.
</Tip>

## الشرح العملي

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
      "description": "مزوّد نماذج Acme AI",
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
          "choiceLabel": "مفتاح API لـ Acme AI",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "مفتاح API لـ Acme AI"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    يصرّح البيان بـ `providerAuthEnvVars` حتى يتمكن OpenClaw من اكتشاف
    بيانات الاعتماد من دون تحميل وقت تشغيل Plugin الخاص بك. وأضف `providerAuthAliases`
    عندما ينبغي لمتغير مزوّد أن يعيد استخدام مصادقة معرّف مزوّد آخر. ويُعد `modelSupport`
    اختياريًا، ويتيح لـ OpenClaw تحميل Plugin المزوّد تلقائيًا من
    معرّفات نماذج مختصرة مثل `acme-large` قبل وجود خطافات وقت التشغيل. وإذا نشرت
    المزوّد على ClawHub، فإن حقول `openclaw.compat` و`openclaw.build`
    هذه تكون مطلوبة في `package.json`.

  </Step>

  <Step title="سجّل المزوّد">
    يحتاج المزوّد الأدنى إلى `id` و`label` و`auth` و`catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "مزوّد نماذج Acme AI",
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
              label: "مفتاح API لـ Acme AI",
              hint: "مفتاح API من لوحة تحكم Acme AI",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "أدخل مفتاح API الخاص بـ Acme AI",
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

    إذا كان المزوّد upstream يستخدم رموز تحكم مختلفة عن OpenClaw، فأضف
    تحويل نصي صغيرًا ثنائي الاتجاه بدلًا من استبدال مسار البث:

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
    النقل. ويعيد `output` كتابة دلتا نص المساعد والنص النهائي قبل
    أن يحلل OpenClaw علامات التحكم الخاصة به أو تسليم القناة.

    بالنسبة إلى المزوّدين المضمّنين الذين يسجلون مزوّد نص واحدًا فقط مع
    مصادقة بمفتاح API بالإضافة إلى وقت تشغيل واحد مدعوم بفهرس، ففضّل
    المساعد الأضيق `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "مزوّد نماذج Acme AI",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "مفتاح API لـ Acme AI",
            hint: "مفتاح API من لوحة تحكم Acme AI",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "أدخل مفتاح API الخاص بـ Acme AI",
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

    يمثل `buildProvider` مسار الفهرس المباشر المستخدم عندما يتمكن OpenClaw من حل
    مصادقة مزوّد حقيقية. وقد يجري اكتشافًا خاصًا بالمزوّد. واستخدم
    `buildStaticProvider` فقط للصفوف غير المتصلة التي يكون عرضها آمنًا قبل
    تكوين المصادقة؛ ويجب ألا يتطلب بيانات اعتماد أو يجري طلبات شبكية.
    وينفّذ عرض `models list --all` في OpenClaw حاليًا الفهارس الثابتة
    فقط للمزوّدين المضمّنين، مع تكوين فارغ، وبيئة فارغة، ومن دون
    مسارات وكيل/مساحة عمل.

    إذا كان تدفق المصادقة لديك يحتاج أيضًا إلى تصحيح `models.providers.*`،
    والأسماء المستعارة، والنموذج الافتراضي للوكيل أثناء الإعداد الأولي،
    فاستخدم مساعدات الإعداد المسبق من
    `openclaw/plugin-sdk/provider-onboard`. وأضيق هذه المساعدات هي
    `createDefaultModelPresetAppliers(...)`،
    و`createDefaultModelsPresetAppliers(...)`، و
    `createModelCatalogPresetAppliers(...)`.

    عندما تدعم نقطة النهاية الأصلية للمزوّد كتل الاستخدام المتدفقة على
    ناقل `openai-completions` العادي، ففضّل مساعدات الفهرس المشتركة في
    `openclaw/plugin-sdk/provider-catalog-shared` بدلًا من ترميز
    فحوصات معرّف المزوّد بشكل صلب. إذ يكتشف
    `supportsNativeStreamingUsageCompat(...)` و
    `applyProviderNativeStreamingUsageCompat(...)` الدعم من خريطة إمكانات
    نقطة النهاية، بحيث تظل نقاط النهاية الأصلية بأسلوب Moonshot/DashScope
    ضمن الاشتراك حتى عندما يستخدم Plugin معرّف مزوّد مخصصًا.

  </Step>

  <Step title="أضف حلًا ديناميكيًا للنماذج">
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

    إذا كان الحل يتطلب طلبًا شبكيًا، فاستخدم `prepareDynamicModel` من أجل
    التهيئة المسبقة غير المتزامنة — إذ يعمل `resolveDynamicModel` مرة أخرى بعد اكتماله.

  </Step>

  <Step title="أضف خطافات وقت التشغيل (عند الحاجة)">
    تحتاج معظم المزوّدات فقط إلى `catalog` + `resolveDynamicModel`. أضف الخطافات
    تدريجيًا حسب ما يتطلبه مزوّدك.

    تغطي بانيات المساعدات المشتركة الآن أكثر عائلات
    إعادة التشغيل/توافق الأدوات شيوعًا، لذلك لا تحتاج Plugins عادةً إلى
    توصيل كل خطاف يدويًا واحدًا تلو الآخر:

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

    | العائلة | ما الذي توصّله |
    | --- | --- |
    | `openai-compatible` | سياسة إعادة تشغيل مشتركة بأسلوب OpenAI لناقلات متوافقة مع OpenAI، بما في ذلك تنقية معرّف استدعاء الأداة، وإصلاحات ترتيب المساعد أولًا، والتحقق العام من دور Gemini عندما يتطلبه الناقل |
    | `anthropic-by-model` | سياسة إعادة تشغيل مدركة لـ Claude يتم اختيارها حسب `modelId`، بحيث لا تحصل ناقلات رسائل Anthropic على تنظيف كتل التفكير الخاصة بـ Claude إلا عندما يكون النموذج المحلول فعلًا معرّف Claude |
    | `google-gemini` | سياسة إعادة تشغيل Gemini الأصلية بالإضافة إلى تنقية إعادة التشغيل عند الإقلاع ووضع إخراج reasoning المعلَّم |
    | `passthrough-gemini` | تنقية thought-signature في Gemini للنماذج التي تعمل عبر ناقلات proxy متوافقة مع OpenAI؛ ولا يفعّل التحقق الأصلي من إعادة تشغيل Gemini أو إعادة الكتابة عند الإقلاع |
    | `hybrid-anthropic-openai` | سياسة هجينة للمزوّدين الذين يمزجون بين أسطح نماذج رسائل Anthropic والأسطح المتوافقة مع OpenAI داخل Plugin واحد؛ ويظل إسقاط كتل التفكير الاختياري الخاص بـ Claude محصورًا في جانب Anthropic |

    أمثلة مضمّنة فعلية:

    - `google` و`google-gemini-cli`: ‏`google-gemini`
    - `openrouter` و`kilocode` و`opencode` و`opencode-go`: ‏`passthrough-gemini`
    - `amazon-bedrock` و`anthropic-vertex`: ‏`anthropic-by-model`
    - `minimax`: ‏`hybrid-anthropic-openai`
    - `moonshot` و`ollama` و`xai` و`zai`: ‏`openai-compatible`

    عائلات البث المتاحة اليوم:

    | العائلة | ما الذي توصّله |
    | --- | --- |
    | `google-thinking` | تطبيع حمولة التفكير في Gemini على مسار البث المشترك |
    | `kilocode-thinking` | غلاف reasoning لـ Kilo على مسار بث proxy المشترك، مع تخطي `kilo/auto` ومعرّفات reasoning غير المدعومة للتفكير المحقون |
    | `moonshot-thinking` | ربط حمولة native-thinking الثنائية في Moonshot انطلاقًا من التكوين + مستوى `/think` |
    | `minimax-fast-mode` | إعادة كتابة نموذج fast-mode في MiniMax على مسار البث المشترك |
    | `openai-responses-defaults` | أغلفة Responses الأصلية المشتركة لـ OpenAI/Codex: رؤوس الإسناد، و`/fast`/`serviceTier`، وتفصيلية النص، وweb search الأصلية لـ Codex، وتشكيل حمولة reasoning-compat، وإدارة سياق Responses |
    | `openrouter-thinking` | غلاف reasoning لـ OpenRouter لمسارات proxy، مع التعامل مركزيًا مع تخطي النماذج غير المدعومة/`auto` |
    | `tool-stream-default-on` | غلاف `tool_stream` مفعّل افتراضيًا لمزوّدين مثل Z.AI ممن يريدون تدفق الأدوات ما لم يتم تعطيله صراحة |

    أمثلة مضمّنة فعلية:

    - `google` و`google-gemini-cli`: ‏`google-thinking`
    - `kilocode`: ‏`kilocode-thinking`
    - `moonshot`: ‏`moonshot-thinking`
    - `minimax` و`minimax-portal`: ‏`minimax-fast-mode`
    - `openai` و`openai-codex`: ‏`openai-responses-defaults`
    - `openrouter`: ‏`openrouter-thinking`
    - `zai`: ‏`tool-stream-default-on`

    يصدر `openclaw/plugin-sdk/provider-model-shared` أيضًا تعداد
    عائلة إعادة التشغيل بالإضافة إلى المساعدات المشتركة التي تُبنى منها تلك العائلات. وتشمل
    التصديرات العامة الشائعة ما يلي:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - بانيات إعادة التشغيل المشتركة مثل `buildOpenAICompatibleReplayPolicy(...)`،
      و`buildAnthropicReplayPolicyForModel(...)`،
      و`buildGoogleGeminiReplayPolicy(...)`، و
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - مساعدات إعادة تشغيل Gemini مثل `sanitizeGoogleGeminiReplayHistory(...)`
      و`resolveTaggedReasoningOutputMode()`
    - مساعدات نقطة النهاية/النموذج مثل `resolveProviderEndpoint(...)`،
      و`normalizeProviderId(...)`، و`normalizeGooglePreviewModelId(...)`، و
      `normalizeNativeXaiModelId(...)`

    يكشف `openclaw/plugin-sdk/provider-stream` عن كل من باني العائلة
    ومساعدات الأغلفة العامة التي تعيد تلك العائلات استخدامها. وتشمل
    التصديرات العامة الشائعة ما يلي:

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

    تبقى بعض مساعدات البث محلية على مستوى المزوّد عمدًا. المثال المضمّن
    الحالي: تصدّر `@openclaw/anthropic-provider`
    `wrapAnthropicProviderStream`، و`resolveAnthropicBetas`،
    و`resolveAnthropicFastMode`، و`resolveAnthropicServiceTier`، و
    بانيات أغلفة Anthropic منخفضة المستوى من طبقة `api.ts` /
    `contract-api.ts` العامة الخاصة بها. وتبقى هذه المساعدات خاصة بـ Anthropic لأن
    ذلك يشفّر أيضًا التعامل مع Claude OAuth beta وبوابة `context1m`.

    كما تحتفظ مزوّدات مضمّنة أخرى أيضًا بأغلفة خاصة بالنقل محليًا عندما
    لا يكون السلوك مشتركًا بشكل نظيف بين العائلات. المثال الحالي: يحتفظ
    Plugin ‏xAI المضمّن بتشكيل Responses الأصلية لـ xAI داخل
    `wrapStreamFn` الخاص به، بما في ذلك إعادة كتابة الأسماء المستعارة لـ `/fast`،
    و`tool_stream` الافتراضي، وتنظيف strict-tool غير المدعوم، وإزالة
    حمولة reasoning الخاصة بـ xAI.

    يكشف `openclaw/plugin-sdk/provider-tools` حاليًا عن عائلة مشتركة واحدة
    لتوافق مخطط الأدوات بالإضافة إلى مساعدات مشتركة للمخطط/التوافق:

    - يوثّق `ProviderToolCompatFamily` مخزون العائلات المشتركة اليوم.
    - يوصّل `buildProviderToolCompatFamilyHooks("gemini")` تنظيف مخطط Gemini
      + التشخيصات للمزوّدين الذين يحتاجون إلى مخططات أدوات آمنة لـ Gemini.
    - يشكل `normalizeGeminiToolSchemas(...)` و`inspectGeminiToolSchemas(...)`
      مساعدات مخطط Gemini العامة الأساسية.
    - يعيد `resolveXaiModelCompatPatch()` تصحيح التوافق المضمّن لـ xAI:
      ‏`toolSchemaProfile: "xai"`، وكلمات مفتاحية للمخطط غير مدعومة، ودعم
      `web_search` الأصلية، وفك ترميز وسائط استدعاء الأدوات المرمّزة بكيانات HTML.
    - يطبّق `applyXaiModelCompat(model)` تصحيح التوافق نفسه لـ xAI على
      نموذج محلول قبل أن يصل إلى المشغّل.

    مثال مضمّن فعلي: يستخدم Plugin ‏xAI كِلَا من `normalizeResolvedModel` و
    `contributeResolvedModelCompat` للحفاظ على امتلاك بيانات تعريف التوافق تلك
    ضمن المزوّد بدلًا من ترميز قواعد xAI في Core.

    ويدعم نمط جذر الحزمة نفسه أيضًا مزوّدين مضمّنين آخرين:

    - `@openclaw/openai-provider`: يصدّر `api.ts` بانيات المزوّد،
      ومساعدات النموذج الافتراضي، وبانيات المزوّدات الآنية
    - `@openclaw/openrouter-provider`: يصدّر `api.ts` باني المزوّد
      بالإضافة إلى مساعدات الإعداد الأولي/التكوين

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
        بالنسبة إلى المزوّدين الذين يحتاجون إلى رؤوس طلبات مخصصة أو تعديلات على جسم الطلب:

        ```typescript
        // يعيد wrapStreamFn قيمة StreamFn مشتقة من ctx.streamFn
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
        بالنسبة إلى المزوّدين الذين يحتاجون إلى رؤوس/بيانات تعريف طلبات أو جلسات أصلية على
        نواقل HTTP أو WebSocket العامة:

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
        بالنسبة إلى المزوّدين الذين يكشفون عن بيانات الاستخدام/الفوترة:

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
      يستدعي OpenClaw الخطافات بهذا الترتيب. تستخدم معظم المزوّدات 2-3 فقط:

      | # | الخطاف | متى يُستخدم |
      | --- | --- | --- |
      | 1 | `catalog` | فهرس النموذج أو الإعدادات الافتراضية لـ base URL |
      | 2 | `applyConfigDefaults` | الإعدادات الافتراضية العامة المملوكة للمزوّد أثناء تمثيل التكوين |
      | 3 | `normalizeModelId` | تنظيف الأسماء المستعارة القديمة/التجريبية لمعرّف النموذج قبل البحث |
      | 4 | `normalizeTransport` | تنظيف `api` / `baseUrl` لعائلة المزوّد قبل تجميع النموذج العام |
      | 5 | `normalizeConfig` | تطبيع تكوين `models.providers.<id>` |
      | 6 | `applyNativeStreamingUsageCompat` | إعادة كتابة توافق الاستخدام المتدفق الأصلي لمزوّدي التكوين |
      | 7 | `resolveConfigApiKey` | حل مصادقة علامات البيئة المملوك للمزوّد |
      | 8 | `resolveSyntheticAuth` | مصادقة synthetic محلية/مستضافة ذاتيًا أو مدعومة بالتكوين |
      | 9 | `shouldDeferSyntheticProfileAuth` | خفض أولويات عناصر placeholder لملف تعريف synthetic المخزنة خلف مصادقة البيئة/التكوين |
      | 10 | `resolveDynamicModel` | قبول معرّفات نماذج upstream الاعتباطية |
      | 11 | `prepareDynamicModel` | جلب بيانات وصفية غير متزامن قبل الحل |
      | 12 | `normalizeResolvedModel` | إعادة كتابة النقل قبل المشغّل |

    ملاحظات الرجوع الاحتياطي وقت التشغيل:

    - يتحقق `normalizeConfig` من المزوّد المطابق أولًا، ثم من
      Plugins المزوّدات الأخرى القادرة على استخدام الخطافات حتى يغيّر أحدها
      التكوين فعليًا. وإذا لم يعِد أي خطاف مزوّد كتابة إدخال تكوين مدعوم من
      عائلة Google، فسيُطبَّق مطبّع تكوين Google المضمّن مع ذلك.
    - يستخدم `resolveConfigApiKey` خطاف المزوّد عند كشفه. كما أن مسار
      `amazon-bedrock` المضمّن يملك أيضًا محلل علامات بيئة AWS مدمجًا هنا،
      رغم أن مصادقة Bedrock وقت التشغيل نفسها ما زالت تستخدم سلسلة AWS SDK
      الافتراضية.
      | 13 | `contributeResolvedModelCompat` | أعلام التوافق لنماذج المورّد خلف ناقل متوافق آخر |
      | 14 | `capabilities` | حقيبة إمكانات ثابتة قديمة؛ للتوافق فقط |
      | 15 | `normalizeToolSchemas` | تنظيف مخطط الأدوات المملوك للمزوّد قبل التسجيل |
      | 16 | `inspectToolSchemas` | تشخيصات مخطط الأدوات المملوكة للمزوّد |
      | 17 | `resolveReasoningOutputMode` | عقد إخراج reasoning المعلَّم مقابل الأصلي |
      | 18 | `prepareExtraParams` | معلمات الطلب الافتراضية |
      | 19 | `createStreamFn` | ناقل StreamFn مخصص بالكامل |
      | 20 | `wrapStreamFn` | أغلفة رؤوس/جسم مخصصة على مسار البث العادي |
      | 21 | `resolveTransportTurnState` | رؤوس/بيانات تعريف أصلية لكل دور |
      | 22 | `resolveWebSocketSessionPolicy` | رؤوس جلسة WS أصلية/فترة تهدئة |
      | 23 | `formatApiKey` | شكل رمز وقت تشغيل مخصص |
      | 24 | `refreshOAuth` | تحديث OAuth مخصص |
      | 25 | `buildAuthDoctorHint` | إرشادات إصلاح المصادقة |
      | 26 | `matchesContextOverflowError` | كشف الفيض المملوك للمزوّد |
      | 27 | `classifyFailoverReason` | تصنيف rate-limit/overload المملوك للمزوّد |
      | 28 | `isCacheTtlEligible` | بوابة TTL لذاكرة prompt cache |
      | 29 | `buildMissingAuthMessage` | تلميح مخصص لغياب المصادقة |
      | 30 | `suppressBuiltInModel` | إخفاء صفوف upstream القديمة |
      | 31 | `augmentModelCatalog` | صفوف synthetic للتوافق المستقبلي |
      | 32 | `resolveThinkingProfile` | مجموعة خيارات `/think` الخاصة بالنموذج |
      | 33 | `isBinaryThinking` | توافق تشغيل/إيقاف التفكير الثنائي |
      | 34 | `supportsXHighThinking` | توافق دعم reasoning من نوع `xhigh` |
      | 35 | `resolveDefaultThinkingLevel` | توافق سياسة `/think` الافتراضية |
      | 36 | `isModernModelRef` | مطابقة النموذج الحي/اختبار smoke |
      | 37 | `prepareRuntimeAuth` | تبادل الرمز قبل الاستدلال |
      | 38 | `resolveUsageAuth` | تحليل بيانات اعتماد الاستخدام المخصص |
      | 39 | `fetchUsageSnapshot` | نقطة نهاية استخدام مخصصة |
      | 40 | `createEmbeddingProvider` | مهايئ embedding يملكه المزوّد للذاكرة/البحث |
      | 41 | `buildReplayPolicy` | سياسة مخصصة لإعادة تشغيل/Compaction للنصوص |
      | 42 | `sanitizeReplayHistory` | إعادة كتابة خاصة بالمزوّد لسجل إعادة التشغيل بعد التنظيف العام |
      | 43 | `validateReplayTurns` | تحقق صارم من أدوار إعادة التشغيل قبل المشغّل المضمّن |
      | 44 | `onModelSelected` | رد نداء بعد الاختيار (مثل telemetry) |

      ملاحظة حول ضبط المطالبات:

      - يتيح `resolveSystemPromptContribution` للمزوّد حقن
        إرشادات مطالبة نظام مدركة للذاكرة المؤقتة لعائلة نماذج. وفضّله على
        `before_prompt_build` عندما يكون السلوك تابعًا لعائلة مزوّد/نموذج واحدة
        ويجب أن يحافظ على تقسيم الذاكرة المؤقتة بين الثابت/الديناميكي.

      للاطلاع على أوصاف مفصلة وأمثلة من العالم الحقيقي، راجع
      [الداخليات: خطافات وقت تشغيل المزوّد](/ar/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="أضف إمكانات إضافية (اختياري)">
    <a id="step-5-add-extra-capabilities"></a>
    يمكن لـ Plugin المزوّد تسجيل الكلام، والنسخ الفوري، والصوت الفوري،
    وفهم الوسائط، وتوليد الصور، وتوليد الفيديو، وweb fetch،
    وweb search إلى جانب الاستدلال النصي:

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
        hint: "اجلب الصفحات عبر الواجهة الخلفية للعرض الخاصة بـ Acme.",
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

    يصنف OpenClaw هذا على أنه Plugin **hybrid-capability**. وهذا هو
    النمط الموصى به لـ Plugins الشركات (Plugin واحد لكل مورّد). راجع
    [الداخليات: ملكية الإمكانات](/ar/plugins/architecture#capability-ownership-model).

    بالنسبة إلى توليد الفيديو، فضّل شكل الإمكانات المدرك للأوضاع كما هو موضح أعلاه:
    `generate` و`imageToVideo` و`videoToVideo`. الحقول التجميعية المسطحة مثل
    `maxInputImages` و`maxInputVideos` و`maxDurationSeconds` ليست
    كافية للإعلان عن دعم أوضاع التحويل أو الأوضاع المعطلة بشكل نظيف.

    يجب أن تتبع مزوّدات توليد الموسيقى النمط نفسه:
    `generate` للتوليد المعتمد على المطالبة فقط و`edit` للتوليد المعتمد على
    الصورة المرجعية. والحقول التجميعية المسطحة مثل `maxInputImages`،
    و`supportsLyrics`، و`supportsFormat` ليست كافية للإعلان عن دعم
    التعديل؛ فكتل `generate` / `edit` الصريحة هي العقد المتوقع.

  </Step>

  <Step title="الاختبار">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // صدّر كائن تكوين المزوّد من index.ts أو من ملف مخصص
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

يتم نشر Plugins المزوّدين بالطريقة نفسها مثل أي Plugin كود خارجي آخر:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

لا تستخدم الاسم المستعار القديم الخاص بالنشر المقتصر على Skills هنا؛ يجب على حزم Plugins استخدام
`clawhub package publish`.

## بنية الملفات

```
<bundled-plugin-root>/acme-ai/
├── package.json              # بيانات تعريف openclaw.providers
├── openclaw.plugin.json      # البيان مع بيانات تعريف مصادقة المزوّد
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # الاختبارات
    └── usage.ts              # نقطة نهاية الاستخدام (اختياري)
```

## مرجع ترتيب الفهرس

يتحكم `catalog.order` في وقت دمج فهرسك بالنسبة إلى
المزوّدات المدمجة:

| الترتيب   | التوقيت       | حالة الاستخدام                                  |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | التمريرة الأولى | مزوّدات بسيطة بمفتاح API                        |
| `profile` | بعد simple    | مزوّدات تخضع لملفات تعريف المصادقة              |
| `paired`  | بعد profile   | تركيب إدخالات متعددة مرتبطة                     |
| `late`    | التمريرة الأخيرة | تجاوز المزوّدات الموجودة (يفوز عند التصادم)    |

## الخطوات التالية

- [Plugins القنوات](/ar/plugins/sdk-channel-plugins) — إذا كان Plugin الخاص بك يوفّر أيضًا قناة
- [وقت تشغيل SDK](/ar/plugins/sdk-runtime) — مساعدات `api.runtime` ‏(TTS والبحث وsubagent)
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل لاستيراد المسارات الفرعية
- [داخليات Plugin](/ar/plugins/architecture#provider-runtime-hooks) — تفاصيل الخطافات والأمثلة المضمّنة
