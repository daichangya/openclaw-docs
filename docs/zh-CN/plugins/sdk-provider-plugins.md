---
read_when:
    - 你正在构建一个新的模型提供商插件
    - 你想将一个兼容 OpenAI 的代理或自定义 LLM 添加到 OpenClaw 中
    - 你需要了解提供商认证、目录和运行时钩子
sidebarTitle: Provider Plugins
summary: 为 OpenClaw 构建模型提供商插件的分步指南
title: 构建提供商插件
x-i18n:
    generated_at: "2026-04-11T01:19:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d7c5da6556dc3d9673a31142ff65eb67ddc97fc0c1a6f4826a2c7693ecd5e3
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# 构建提供商插件

本指南将带你构建一个为 OpenClaw 添加模型提供商（LLM）的提供商插件。完成后，你将拥有一个带有模型目录、API 密钥认证和动态模型解析的提供商。

<Info>
  如果你之前从未构建过任何 OpenClaw 插件，请先阅读 [入门指南](/zh-CN/plugins/building-plugins) 以了解基础包结构和清单设置。
</Info>

<Tip>
  提供商插件会将模型添加到 OpenClaw 的常规推理循环中。如果模型必须通过一个原生智能体守护进程运行，并且该守护进程负责线程、压缩或工具事件，请将该提供商与一个 [agent harness](/zh-CN/plugins/sdk-agent-harness) 配合使用，而不是把守护进程协议细节放进核心中。
</Tip>

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
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

    清单声明了 `providerAuthEnvVars`，这样 OpenClaw 无需加载你的插件运行时就能检测凭证。当某个提供商变体应复用另一个提供商 id 的认证时，添加 `providerAuthAliases`。`modelSupport` 是可选的，它允许 OpenClaw 在运行时钩子存在之前，就根据像 `acme-large` 这样的简写模型 id 自动加载你的提供商插件。如果你要在 ClawHub 上发布该提供商，那么 `package.json` 中的这些 `openclaw.compat` 和 `openclaw.build` 字段是必需的。

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

    这就是一个可用的提供商。现在用户可以运行
    `openclaw onboard --acme-ai-api-key <key>`，并选择
    `acme-ai/acme-large` 作为他们的模型。

    如果上游提供商使用的控制令牌与 OpenClaw 不同，请添加一个小型双向文本转换，而不是替换流路径：

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

    `input` 会在传输前重写最终系统提示和文本消息内容。`output` 会在 OpenClaw 解析其自身控制标记或进行渠道投递之前，重写助手文本增量和最终文本。

    对于只注册一个带 API 密钥认证的文本提供商，并且只有一个基于目录的运行时的内置提供商，优先使用更窄的 `defineSingleProviderPluginEntry(...)` 辅助方法：

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

    如果你的认证流程还需要在新手引导期间修补 `models.providers.*`、别名以及智能体默认模型，请使用 `openclaw/plugin-sdk/provider-onboard` 中的预设辅助方法。最窄的辅助方法是 `createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)` 和 `createModelCatalogPresetAppliers(...)`。

    当提供商的原生端点在常规 `openai-completions` 传输上支持分块流式传输使用块时，优先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共享目录辅助方法，而不是硬编码提供商 id 检查。`supportsNativeStreamingUsageCompat(...)` 和 `applyProviderNativeStreamingUsageCompat(...)` 会从端点能力映射中检测支持情况，因此即使插件使用的是自定义提供商 id，原生 Moonshot/DashScope 风格的端点仍然可以选择启用。

  </Step>

  <Step title="添加动态模型解析">
    如果你的提供商接受任意模型 id（例如代理或路由器），请添加 `resolveDynamicModel`：

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

    如果解析需要进行网络调用，请使用 `prepareDynamicModel` 进行异步预热 —— 在其完成后会再次运行 `resolveDynamicModel`。

  </Step>

  <Step title="按需添加运行时钩子">
    大多数提供商只需要 `catalog` + `resolveDynamicModel`。随着你的提供商需要更多能力，再逐步添加钩子。

    共享辅助构建器现在已经覆盖最常见的重放/工具兼容性系列，因此插件通常不需要逐个手动接线每个钩子：

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

    当前可用的重放系列：

    | 系列 | 接入内容 |
    | --- | --- |
    | `openai-compatible` | 用于兼容 OpenAI 传输的共享 OpenAI 风格重放策略，包括工具调用 id 清理、助手优先顺序修复，以及在传输需要时的通用 Gemini 回合校验 |
    | `anthropic-by-model` | 按 `modelId` 选择的 Claude 感知重放策略，因此 Anthropic 消息传输只有在解析后的模型确实是 Claude id 时，才会获得 Claude 特有的思维块清理 |
    | `google-gemini` | 原生 Gemini 重放策略，外加引导重放清理和带标签的推理输出模式 |
    | `passthrough-gemini` | 用于通过兼容 OpenAI 的代理传输运行的 Gemini 模型的 Gemini thought-signature 清理；不会启用原生 Gemini 重放校验或引导重写 |
    | `hybrid-anthropic-openai` | 适用于在同一个插件中混合 Anthropic 消息和兼容 OpenAI 的模型表面的提供商的混合策略；可选的仅 Claude 思维块丢弃仍然只作用于 Anthropic 一侧 |

    真实的内置示例：

    - `google` 和 `google-gemini-cli`：`google-gemini`
    - `openrouter`、`kilocode`、`opencode` 和 `opencode-go`：`passthrough-gemini`
    - `amazon-bedrock` 和 `anthropic-vertex`：`anthropic-by-model`
    - `minimax`：`hybrid-anthropic-openai`
    - `moonshot`、`ollama`、`xai` 和 `zai`：`openai-compatible`

    当前可用的流系列：

    | 系列 | 接入内容 |
    | --- | --- |
    | `google-thinking` | 共享流路径上的 Gemini thinking 负载规范化 |
    | `kilocode-thinking` | 共享代理流路径上的 Kilo 推理包装器，其中 `kilo/auto` 和不支持代理推理 id 的情况会跳过注入的 thinking |
    | `moonshot-thinking` | 基于配置和 `/think` 级别的 Moonshot 二进制原生 thinking 负载映射 |
    | `minimax-fast-mode` | 共享流路径上的 MiniMax 快速模式模型重写 |
    | `openai-responses-defaults` | 共享原生 OpenAI/Codex Responses 包装器：归属标头、`/fast`/`serviceTier`、文本详细程度、原生 Codex web 搜索、推理兼容负载整形以及 Responses 上下文管理 |
    | `openrouter-thinking` | 用于代理路由的 OpenRouter 推理包装器，并集中处理不支持模型/`auto` 的跳过逻辑 |
    | `tool-stream-default-on` | 为像 Z.AI 这样的提供商提供默认开启的 `tool_stream` 包装器，除非被显式禁用 |

    真实的内置示例：

    - `google` 和 `google-gemini-cli`：`google-thinking`
    - `kilocode`：`kilocode-thinking`
    - `moonshot`：`moonshot-thinking`
    - `minimax` 和 `minimax-portal`：`minimax-fast-mode`
    - `openai` 和 `openai-codex`：`openai-responses-defaults`
    - `openrouter`：`openrouter-thinking`
    - `zai`：`tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` 还会导出 replay 系列枚举，以及这些系列所基于的共享辅助方法。常见的公共导出包括：

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - 共享 replay 构建器，例如 `buildOpenAICompatibleReplayPolicy(...)`、
      `buildAnthropicReplayPolicyForModel(...)`、
      `buildGoogleGeminiReplayPolicy(...)` 和
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini replay 辅助方法，例如 `sanitizeGoogleGeminiReplayHistory(...)`
      和 `resolveTaggedReasoningOutputMode()`
    - 端点/模型辅助方法，例如 `resolveProviderEndpoint(...)`、
      `normalizeProviderId(...)`、`normalizeGooglePreviewModelId(...)` 和
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` 同时公开系列构建器和这些系列复用的公共包装器辅助方法。常见的公共导出包括：

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - 共享 OpenAI/Codex 包装器，例如
      `createOpenAIAttributionHeadersWrapper(...)`、
      `createOpenAIFastModeWrapper(...)`、
      `createOpenAIServiceTierWrapper(...)`、
      `createOpenAIResponsesContextManagementWrapper(...)` 和
      `createCodexNativeWebSearchWrapper(...)`
    - 共享代理/提供商包装器，例如 `createOpenRouterWrapper(...)`、
      `createToolStreamWrapper(...)` 和 `createMinimaxFastModeWrapper(...)`

    一些流辅助方法会有意保留在提供商本地。当前的内置示例：`@openclaw/anthropic-provider` 通过其公共 `api.ts` / `contract-api.ts` 接缝导出 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及更底层的 Anthropic 包装器构建器。这些辅助方法仍然保持为 Anthropic 专用，因为它们还编码了 Claude OAuth beta 处理和 `context1m` 门控。

    其他内置提供商也会在行为无法在系列之间清晰共享时，将传输专用包装器保留在本地。当前示例：内置 xAI 插件将原生 xAI Responses 整形保留在自己的 `wrapStreamFn` 中，包括 `/fast` 别名重写、默认 `tool_stream`、不受支持的严格工具清理，以及 xAI 专用的推理负载移除。

    `openclaw/plugin-sdk/provider-tools` 当前公开一个共享工具 schema 系列，以及共享 schema/兼容辅助方法：

    - `ProviderToolCompatFamily` 记录了当前共享的系列清单。
    - `buildProviderToolCompatFamilyHooks("gemini")` 为需要 Gemini 安全工具 schema 的提供商接入 Gemini schema 清理 + 诊断。
    - `normalizeGeminiToolSchemas(...)` 和 `inspectGeminiToolSchemas(...)` 是底层的公共 Gemini schema 辅助方法。
    - `resolveXaiModelCompatPatch()` 返回内置 xAI 兼容补丁：
      `toolSchemaProfile: "xai"`、不受支持的 schema 关键字、原生
      `web_search` 支持，以及 HTML 实体工具调用参数解码。
    - `applyXaiModelCompat(model)` 会在解析后的模型到达运行器之前，对其应用相同的 xAI 兼容补丁。

    真实的内置示例：xAI 插件使用 `normalizeResolvedModel` 和 `contributeResolvedModelCompat`，从而让这些兼容元数据由提供商自行维护，而不是在核心中硬编码 xAI 规则。

    相同的包根模式也支持其他内置提供商：

    - `@openclaw/openai-provider`：`api.ts` 导出提供商构建器、默认模型辅助方法和 realtime 提供商构建器
    - `@openclaw/openrouter-provider`：`api.ts` 导出提供商构建器以及新手引导/配置辅助方法

    <Tabs>
      <Tab title="令牌交换">
        对于需要在每次推理调用之前进行令牌交换的提供商：

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
      <Tab title="原生传输标识">
        对于需要在通用 HTTP 或 WebSocket 传输上添加原生请求/会话标头或元数据的提供商：

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
      <Tab title="用量和计费">
        对于公开用量/计费数据的提供商：

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
      OpenClaw 会按如下顺序调用钩子。大多数提供商只会用到 2-3 个：

      | # | 钩子 | 何时使用 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目录或 `baseUrl` 默认值 |
      | 2 | `applyConfigDefaults` | 配置具体化期间由提供商拥有的全局默认值 |
      | 3 | `normalizeModelId` | 查找前清理旧版/预览模型 id 别名 |
      | 4 | `normalizeTransport` | 通用模型组装前清理提供商系列的 `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 规范化 `models.providers.<id>` 配置 |
      | 6 | `applyNativeStreamingUsageCompat` | 针对配置提供商的原生流式用量兼容重写 |
      | 7 | `resolveConfigApiKey` | 由提供商拥有的环境标记认证解析 |
      | 8 | `resolveSyntheticAuth` | 本地/自托管或基于配置的合成认证 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 将合成的已存储配置文件占位符降级到环境变量/配置认证之后 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 id |
      | 11 | `prepareDynamicModel` | 解析前的异步元数据获取 |
      | 12 | `normalizeResolvedModel` | 运行器之前的传输重写 |

    运行时回退说明：

    - `normalizeConfig` 会先检查匹配的提供商，然后再检查其他支持钩子的提供商插件，直到某个插件实际修改了配置。
      如果没有任何提供商钩子重写受支持的 Google 系列配置项，内置的 Google 配置规范化仍会应用。
    - `resolveConfigApiKey` 会在暴露该钩子时使用提供商钩子。内置的
      `amazon-bedrock` 路径在这里也有一个内建的 AWS 环境标记解析器，尽管 Bedrock 运行时认证本身仍然使用 AWS SDK 默认链。
      | 13 | `contributeResolvedModelCompat` | 为运行在其他兼容传输之后的厂商模型提供兼容标志 |
      | 14 | `capabilities` | 旧版静态能力包；仅用于兼容 |
      | 15 | `normalizeToolSchemas` | 注册前由提供商拥有的工具 schema 清理 |
      | 16 | `inspectToolSchemas` | 由提供商拥有的工具 schema 诊断 |
      | 17 | `resolveReasoningOutputMode` | 带标签与原生推理输出契约 |
      | 18 | `prepareExtraParams` | 默认请求参数 |
      | 19 | `createStreamFn` | 完全自定义的 `StreamFn` 传输 |
      | 20 | `wrapStreamFn` | 常规流路径上的自定义标头/请求体包装器 |
      | 21 | `resolveTransportTurnState` | 原生逐回合标头/元数据 |
      | 22 | `resolveWebSocketSessionPolicy` | 原生 WS 会话标头/冷却时间 |
      | 23 | `formatApiKey` | 自定义运行时令牌形态 |
      | 24 | `refreshOAuth` | 自定义 OAuth 刷新 |
      | 25 | `buildAuthDoctorHint` | 认证修复指导 |
      | 26 | `matchesContextOverflowError` | 由提供商拥有的溢出检测 |
      | 27 | `classifyFailoverReason` | 由提供商拥有的限流/过载分类 |
      | 28 | `isCacheTtlEligible` | 提示缓存 TTL 门控 |
      | 29 | `buildMissingAuthMessage` | 自定义缺失认证提示 |
      | 30 | `suppressBuiltInModel` | 隐藏过时的上游条目 |
      | 31 | `augmentModelCatalog` | 合成的前向兼容条目 |
      | 32 | `isBinaryThinking` | 二进制 thinking 开/关 |
      | 33 | `supportsXHighThinking` | `xhigh` 推理支持 |
      | 34 | `resolveDefaultThinkingLevel` | 默认 `/think` 策略 |
      | 35 | `isModernModelRef` | live/smoke 模型匹配 |
      | 36 | `prepareRuntimeAuth` | 推理前的令牌交换 |
      | 37 | `resolveUsageAuth` | 自定义用量凭证解析 |
      | 38 | `fetchUsageSnapshot` | 自定义用量端点 |
      | 39 | `createEmbeddingProvider` | 用于记忆/搜索的、由提供商拥有的 embedding 适配器 |
      | 40 | `buildReplayPolicy` | 自定义转录 replay/压缩策略 |
      | 41 | `sanitizeReplayHistory` | 通用清理之后的提供商专用 replay 重写 |
      | 42 | `validateReplayTurns` | 嵌入式运行器之前的严格 replay 回合校验 |
      | 43 | `onModelSelected` | 选择模型后的回调（例如遥测） |

      提示调优说明：

      - `resolveSystemPromptContribution` 允许提供商为某个模型系列注入具备缓存感知能力的系统提示指导。对于属于单个提供商/模型系列并且应保留稳定/动态缓存拆分的行为，优先使用它而不是 `before_prompt_build`。

      有关详细说明和真实示例，请参阅
      [内部机制：提供商运行时钩子](/zh-CN/plugins/architecture#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    <a id="step-5-add-extra-capabilities"></a>
    提供商插件除了文本推理之外，还可以注册语音、实时转录、实时语音、媒体理解、图像生成、视频生成、web 抓取和 web 搜索：

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

    OpenClaw 会将其归类为 **hybrid-capability** 插件。这是公司插件（每个厂商一个插件）的推荐模式。参见 [内部机制：能力归属](/zh-CN/plugins/architecture#capability-ownership-model)。

    对于视频生成，优先使用上面展示的按模式区分的能力结构：
    `generate`、`imageToVideo` 和 `videoToVideo`。像 `maxInputImages`、`maxInputVideos` 和 `maxDurationSeconds` 这样的扁平聚合字段，不足以清晰地声明转换模式支持或已禁用模式。

    音乐生成提供商也应遵循相同模式：
    `generate` 用于仅基于提示词的生成，`edit` 用于基于参考图像的生成。像 `maxInputImages`、`supportsLyrics` 和 `supportsFormat` 这样的扁平聚合字段，不足以声明编辑支持；显式的 `generate` / `edit` 块才是预期契约。

  </Step>

  <Step title="测试">
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

## 发布到 ClawHub

提供商插件的发布方式与任何其他外部代码插件相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

这里不要使用旧版仅限 Skills 的发布别名；插件包应使用
`clawhub package publish`。

## 文件结构

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 元数据
├── openclaw.plugin.json      # 带有提供商认证元数据的清单
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 测试
    └── usage.ts              # 用量端点（可选）
```

## 目录顺序参考

`catalog.order` 控制你的目录相对于内置提供商在何时合并：

| 顺序 | 时机 | 使用场景 |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一轮 | 普通 API 密钥提供商 |
| `profile` | 在 simple 之后 | 受认证配置文件控制的提供商 |
| `paired`  | 在 profile 之后 | 合成多个相关条目 |
| `late`    | 最后一轮 | 覆盖现有提供商（冲突时获胜） |

## 后续步骤

- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 如果你的插件也提供一个渠道
- [SDK 运行时](/zh-CN/plugins/sdk-runtime) — `api.runtime` 辅助方法（TTS、搜索、subagent）
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 完整的子路径导入参考
- [插件内部机制](/zh-CN/plugins/architecture#provider-runtime-hooks) — 钩子细节和内置示例
