---
read_when:
    - 你正在构建一个新的模型提供商插件
    - 你想将兼容 OpenAI 的代理或自定义 LLM 添加到 OpenClaw
    - 你需要了解提供商认证、目录和运行时钩子
sidebarTitle: Provider plugins
summary: 构建 OpenClaw 模型提供商插件的分步指南
title: 构建提供商插件
x-i18n:
    generated_at: "2026-04-23T20:57:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00e5d092a55469f0a29c8414fd4dcd49f2f1955c4d8734d6cf7967813ba7cde1
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

本指南将带你一步步构建一个提供商插件，为 OpenClaw 添加一个模型提供商（LLM）。完成后，你将拥有一个具备模型目录、API key 认证和动态模型解析能力的提供商。

<Info>
  如果你之前从未构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基本包结构和清单设置。
</Info>

<Tip>
  提供商插件会将模型添加到 OpenClaw 的标准推理循环中。如果模型必须通过一个拥有线程、压缩或工具事件的原生智能体守护进程运行，请将该提供商与一个[智能体 harness](/zh-CN/plugins/sdk-agent-harness) 配合使用，而不要把守护进程协议细节放进核心中。
</Tip>

## 演练

<Steps>
  <Step title="包和清单">
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

    该清单声明了 `providerAuthEnvVars`，这样 OpenClaw 就能在不加载你的插件运行时的情况下检测凭证。
    当某个提供商变体应复用另一个提供商 id 的认证时，请添加 `providerAuthAliases`。
    `modelSupport` 是可选项，它允许 OpenClaw 在运行时钩子存在之前，就通过像 `acme-large` 这样的简写模型 id 自动加载你的提供商插件。
    如果你要在 ClawHub 上发布该提供商，那么 `package.json` 中的这些 `openclaw.compat` 和 `openclaw.build` 字段是必需的。

  </Step>

  <Step title="注册提供商">
    一个最小可用的提供商需要 `id`、`label`、`auth` 和 `catalog`：

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

    这样就得到了一个可工作的提供商。用户现在可以执行
    `openclaw onboard --acme-ai-api-key <key>`，并选择
    `acme-ai/acme-large` 作为模型。

    如果上游提供商使用的控制令牌与 OpenClaw 不同，请添加一个小型双向文本转换，而不是替换整个流路径：

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

    `input` 会在传输前重写最终 system prompt 和文本消息内容。
    `output` 会在 OpenClaw 解析自身控制标记或进行渠道投递之前，重写助手文本增量和最终文本。

    对于只注册一个文本提供商、并带有 API key 认证和单个基于 catalog 的运行时的内置提供商，请优先使用更窄的
    `defineSingleProviderPluginEntry(...)` 辅助工具：

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

    `buildProvider` 是实时 catalog 路径，在 OpenClaw 能解析真实提供商认证时使用。它可以执行提供商专用发现。
    `buildStaticProvider` 仅用于离线行，这些行在认证尚未配置时也可以安全显示；它不得要求凭证或发起网络请求。
    OpenClaw 的 `models list --all` 显示当前只会为内置提供商插件执行静态 catalog，而且会以空配置、空环境以及无智能体/工作区路径的方式执行。

    如果你的认证流程还需要在新手引导期间修补 `models.providers.*`、别名以及智能体默认模型，请使用
    `openclaw/plugin-sdk/provider-onboard` 中的预设辅助工具。最窄的辅助工具包括
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    当某个提供商的原生端点在普通 `openai-completions` 传输上支持流式 usage blocks 时，请优先使用
    `openclaw/plugin-sdk/provider-catalog-shared` 中的共享 catalog 辅助工具，而不是硬编码提供商 id 检查。
    `supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 会从端点能力映射中检测支持情况，因此即使插件使用自定义 provider id，原生 Moonshot/DashScope 风格端点也仍可启用该能力。

  </Step>

  <Step title="添加动态模型解析">
    如果你的提供商接受任意模型 ID（如代理或路由器），请添加 `resolveDynamicModel`：

    ```typescript
    api.registerProvider({
      // ... 上文中的 id、label、auth、catalog

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

    如果解析过程需要网络调用，请使用 `prepareDynamicModel` 进行异步预热——在它完成后，`resolveDynamicModel` 会再次运行。

  </Step>

  <Step title="按需添加运行时钩子">
    大多数提供商只需要 `catalog` + `resolveDynamicModel`。随着你的提供商需求增加，再逐步添加钩子。

    共享辅助构建器现在已经覆盖了最常见的重放/工具兼容家族，因此插件通常不需要手动逐个接线每个钩子：

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

    当前可用的重放家族：

    | 家族 | 接入内容 | 内置示例 |
    | --- | --- | --- |
    | `openai-compatible` | 面向 OpenAI 兼容传输的共享 OpenAI 风格重放策略，包括 tool-call-id 清洗、assistant-first 顺序修复，以及在传输需要时的通用 Gemini 轮次校验 | `moonshot`、`ollama`、`xai`、`zai` |
    | `anthropic-by-model` | 按 `modelId` 选择 Claude 感知重放策略，因此 Anthropic-message 传输仅在解析出的模型确实是 Claude id 时，才获得 Claude 专用的 thinking-block 清理 | `amazon-bedrock`、`anthropic-vertex` |
    | `google-gemini` | 原生 Gemini 重放策略，加上 bootstrap 重放清洗和带标签的 reasoning-output 模式 | `google`、`google-gemini-cli` |
    | `passthrough-gemini` | 面向通过 OpenAI 兼容代理传输运行的 Gemini 模型的 thought-signature 清洗；不会启用原生 Gemini 重放校验或 bootstrap 重写 | `openrouter`、`kilocode`、`opencode`、`opencode-go` |
    | `hybrid-anthropic-openai` | 面向在同一个插件中混合 Anthropic-message 和 OpenAI 兼容模型界面的提供商的混合策略；可选的仅 Claude thinking-block 丢弃仍限定在 Anthropic 一侧 | `minimax` |

    当前可用的流式传输家族：

    | 家族 | 接入内容 | 内置示例 |
  | --- | --- | --- |
  | `google-thinking` | 在共享流路径上规范化 Gemini thinking 载荷 | `google`、`google-gemini-cli` |
  | `kilocode-thinking` | 在共享代理流路径上处理 Kilo reasoning 包装，其中 `kilo/auto` 和不受支持的代理 reasoning id 会跳过注入的 thinking | `kilocode` |
  | `moonshot-thinking` | 根据配置 + `/think` level 映射 Moonshot 二进制原生 thinking 载荷 | `moonshot` |
  | `minimax-fast-mode` | 在共享流路径上重写 MiniMax fast-mode 模型 | `minimax`、`minimax-portal` |
  | `openai-responses-defaults` | 共享原生 OpenAI/Codex Responses 包装器：归因标头、`/fast`/`serviceTier`、文本详细程度、原生 Codex web 搜索、reasoning 兼容载荷整形以及 Responses 上下文管理 | `openai`、`openai-codex` |
  | `openrouter-thinking` | 面向代理路由的 OpenRouter reasoning 包装器，并集中处理不支持模型/`auto` 的跳过逻辑 | `openrouter` |
  | `tool-stream-default-on` | 对于像 Z.AI 这类默认希望启用工具流式传输、除非显式禁用的提供商，提供默认开启的 `tool_stream` 包装器 | `zai` |

    <Accordion title="为这些家族构建器提供能力的 SDK seams">
      每个家族构建器都由同一包中导出的更底层公共辅助工具组合而成；当某个提供商需要偏离通用模式时，你可以直接使用这些工具：

      - `openclaw/plugin-sdk/provider-model-shared` —— `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始重放构建器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。同时还导出 Gemini 重放辅助工具（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）以及端点/模型辅助工具（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）。
      - `openclaw/plugin-sdk/provider-stream` —— `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共享 OpenAI/Codex 包装器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）和共享代理/提供商包装器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` —— `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、底层 Gemini schema 辅助工具（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`），以及 xAI 兼容辅助工具（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。内置的 xAI 插件会配合这些工具使用 `normalizeResolvedModel` + `contributeResolvedModelCompat`，从而让 xAI 规则由提供商自身负责。

      某些流式辅助工具会有意保留为提供商本地实现。`@openclaw/anthropic-provider` 会将 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及更底层的 Anthropic 包装器构建器保留在其自己的公共 `api.ts` / `contract-api.ts` seam 中，因为它们编码了 Claude OAuth beta 处理和 `context1m` 门控。xAI 插件同样也在自己的 `wrapStreamFn` 中保留了原生 xAI Responses 整形逻辑（`/fast` 别名、默认 `tool_stream`、不支持的 strict-tool 清理，以及 xAI 专用 reasoning 载荷移除）。

      同样的包根模式也支撑着 `@openclaw/openai-provider`（provider 构建器、默认模型辅助工具、realtime provider 构建器）和 `@openclaw/openrouter-provider`（provider 构建器以及新手引导/配置辅助工具）。
    </Accordion>

    <Tabs>
      <Tab title="令牌交换">
        对于那些在每次推理调用前都需要执行令牌交换的提供商：

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
      <Tab title="自定义标头">
        对于需要自定义请求标头或请求体修改的提供商：

        ```typescript
        // wrapStreamFn 返回一个派生自 ctx.streamFn 的 StreamFn
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
      <Tab title="原生传输身份">
        对于需要在通用 HTTP 或 WebSocket 传输上附加原生请求/会话标头或元数据的提供商：

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
      <Tab title="用量与计费">
        对于暴露用量/计费数据的提供商：

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

    <Accordion title="所有可用的提供商钩子">
      OpenClaw 会按以下顺序调用钩子。大多数提供商只会用到 2–3 个：

      | # | 钩子 | 何时使用 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目录或 base URL 默认值 |
      | 2 | `applyConfigDefaults` | 在配置物化期间应用由提供商自有的全局默认值 |
      | 3 | `normalizeModelId` | 在查找前清理 legacy/preview 模型 id 别名 |
      | 4 | `normalizeTransport` | 在通用模型组装前清理 provider 家族的 `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 规范化 `models.providers.<id>` 配置 |
      | 6 | `applyNativeStreamingUsageCompat` | 为配置提供商应用原生流式 usage 兼容重写 |
      | 7 | `resolveConfigApiKey` | 由提供商自有的 env-marker 认证解析 |
      | 8 | `resolveSyntheticAuth` | 本地/自托管或基于配置的 synthetic 认证 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 将 synthetic 存储配置档案占位符置于 env/config 认证之后 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 ID |
      | 11 | `prepareDynamicModel` | 在解析前进行异步元数据获取 |
      | 12 | `normalizeResolvedModel` | 在运行器前进行传输重写 |
      | 13 | `contributeResolvedModelCompat` | 为运行在另一兼容传输后的供应商模型提供兼容标志 |
      | 14 | `capabilities` | 旧版静态能力包；仅用于兼容 |
      | 15 | `normalizeToolSchemas` | 在注册前由提供商自有的工具 schema 清理 |
      | 16 | `inspectToolSchemas` | 由提供商自有的工具 schema 诊断 |
      | 17 | `resolveReasoningOutputMode` | 带标签与原生 reasoning-output 契约 |
      | 18 | `prepareExtraParams` | 默认请求参数 |
      | 19 | `createStreamFn` | 完全自定义的 StreamFn 传输 |
      | 20 | `wrapStreamFn` | 在普通流路径上包装自定义标头/请求体 |
      | 21 | `resolveTransportTurnState` | 原生按轮次标头/元数据 |
      | 22 | `resolveWebSocketSessionPolicy` | 原生 WS 会话标头/冷却 |
      | 23 | `formatApiKey` | 自定义运行时令牌形状 |
      | 24 | `refreshOAuth` | 自定义 OAuth 刷新 |
      | 25 | `buildAuthDoctorHint` | 认证修复指导 |
      | 26 | `matchesContextOverflowError` | 由提供商自有的溢出检测 |
      | 27 | `classifyFailoverReason` | 由提供商自有的速率限制/过载分类 |
      | 28 | `isCacheTtlEligible` | 提示词缓存 TTL 门控 |
      | 29 | `buildMissingAuthMessage` | 自定义缺失认证提示 |
      | 30 | `suppressBuiltInModel` | 隐藏陈旧的上游行 |
      | 31 | `augmentModelCatalog` | synthetic 前向兼容行 |
      | 32 | `resolveThinkingProfile` | 模型专用 `/think` 选项集 |
      | 33 | `isBinaryThinking` | 二进制 thinking 开/关兼容性 |
      | 34 | `supportsXHighThinking` | `xhigh` reasoning 支持兼容性 |
      | 35 | `resolveDefaultThinkingLevel` | 默认 `/think` 策略兼容性 |
      | 36 | `isModernModelRef` | live/smoke 模型匹配 |
      | 37 | `prepareRuntimeAuth` | 推理前令牌交换 |
      | 38 | `resolveUsageAuth` | 自定义用量凭证解析 |
      | 39 | `fetchUsageSnapshot` | 自定义用量端点 |
      | 40 | `createEmbeddingProvider` | 用于 memory/search 的提供商自有 embedding 适配器 |
      | 41 | `buildReplayPolicy` | 自定义 transcript 重放/压缩策略 |
      | 42 | `sanitizeReplayHistory` | 通用清理后进行提供商特定的重放重写 |
      | 43 | `validateReplayTurns` | 在内置运行器前进行严格的重放轮次校验 |
      | 44 | `onModelSelected` | 选择后回调（例如遥测） |

      运行时回退说明：

      - `normalizeConfig` 会先检查匹配的提供商，然后再检查其他具备钩子能力的提供商插件，直到某个插件真正改写了配置为止。如果没有任何提供商钩子重写支持的 Google 家族配置条目，则仍会应用内置 Google 配置规范化器。
      - `resolveConfigApiKey` 在暴露该钩子时会使用提供商钩子。内置的 `amazon-bedrock` 路径这里还有一个内建的 AWS env-marker 解析器，尽管 Bedrock 运行时认证本身仍使用 AWS SDK 默认链。
      - `resolveSystemPromptContribution` 允许某个提供商为模型家族注入具备缓存感知能力的 system prompt 指导。当行为属于某个提供商/模型家族，并且需要保留稳定/动态缓存拆分时，应优先使用它，而不是 `before_prompt_build`。

      详细描述和真实示例请参阅[内部机制：提供商运行时钩子](/zh-CN/plugins/architecture#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    提供商插件除了文本推理外，还可以注册语音、实时转录、实时语音、媒体理解、图像生成、视频生成、web 抓取和 web 搜索。OpenClaw 将其归类为**混合能力**插件——这是公司级插件的推荐模式（每个厂商一个插件）。请参阅
    [内部机制：能力归属](/zh-CN/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 中，与现有的 `api.registerProvider(...)` 调用一起注册每项能力。
    只选择你需要的选项卡：

    <Tabs>
      <Tab title="语音（TTS）">
        ```typescript
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
        ```
      </Tab>
      <Tab title="实时转录">
        优先使用 `createRealtimeTranscriptionWebSocketSession(...)` —— 这个共享辅助工具会处理代理捕获、重连退避、关闭时刷新、ready 握手、音频排队和关闭事件诊断。你的插件只需要映射上游事件。

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

        通过 POST multipart 音频执行批量 STT 的提供商应使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。该辅助工具会规范化上传
        文件名，包括那些需要使用 M4A 风格文件名才能兼容转写 API 的 AAC 上传。
      </Tab>
      <Tab title="实时语音">
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
      <Tab title="媒体理解">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="图像和视频生成">
        视频能力使用**模式感知**结构：`generate`、
        `imageToVideo` 和 `videoToVideo`。像
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` 这样的扁平聚合字段并不足以清晰声明变换模式支持或禁用的模式。
        音乐生成遵循相同模式，使用显式的 `generate` /
        `edit` 区块。

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* 图像结果 */ }),
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
      <Tab title="Web 抓取和搜索">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "通过 Acme 的渲染后端抓取页面。",
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
            description: "通过 Acme Fetch 抓取页面。",
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

  <Step title="测试">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // 从 index.ts 或专门文件中导出你的 provider 配置对象
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("解析动态模型", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("当 key 可用时返回 catalog", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("当没有 key 时返回 null catalog", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## 发布到 ClawHub

提供商插件与其他外部代码插件的发布方式相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

这里不要使用旧版仅 Skills 的发布别名；插件包应使用
`clawhub package publish`。

## 文件结构

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 元数据
├── openclaw.plugin.json      # 带 provider 认证元数据的清单
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 测试
    └── usage.ts              # 用量端点（可选）
```

## Catalog 顺序参考

`catalog.order` 控制你的 catalog 相对于内置
providers 的合并时机：

| 顺序 | 时机 | 使用场景 |
| --------- | ------------- | ----------------------------------------------- |
| `simple` | 第一轮 | 普通 API key 提供商 |
| `profile` | 在 simple 之后 | 依赖认证配置档案的提供商 |
| `paired` | 在 profile 之后 | 合成多个相关条目 |
| `late` | 最后一轮 | 覆盖现有提供商（冲突时胜出） |

## 下一步

- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) —— 如果你的插件也提供一个渠道
- [SDK 运行时](/zh-CN/plugins/sdk-runtime) —— `api.runtime` 辅助工具（TTS、搜索、subagent）
- [SDK 概览](/zh-CN/plugins/sdk-overview) —— 完整的子路径导入参考
- [插件内部机制](/zh-CN/plugins/architecture#provider-runtime-hooks) —— 钩子细节和内置示例
