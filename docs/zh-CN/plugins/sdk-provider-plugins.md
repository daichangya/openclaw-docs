---
read_when:
    - 你正在构建一个新的模型提供商插件
    - 你想将与 OpenAI 兼容的代理或自定义 LLM 添加到 OpenClaw 中
    - 你需要理解提供商认证、目录和运行时钩子
sidebarTitle: Provider plugins
summary: 为 OpenClaw 构建模型提供商插件的分步指南
title: 构建提供商插件
x-i18n:
    generated_at: "2026-04-24T18:37:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddfe0e61aa08dda3134728e364fbbf077fe0edfb16e31fc102adc9585bc8c1ac
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

本指南将带你构建一个提供商插件，为 OpenClaw 添加一个模型提供商（LLM）。完成后，你将拥有一个具备模型目录、API 密钥认证和动态模型解析能力的提供商。

<Info>
  如果你之前没有构建过任何 OpenClaw 插件，请先阅读
  [入门指南](/zh-CN/plugins/building-plugins)，了解基础的软件包结构和清单设置。
</Info>

<Tip>
  提供商插件会将模型添加到 OpenClaw 的常规推理循环中。如果模型必须通过一个拥有线程、压缩或工具事件控制权的原生智能体守护进程运行，请将该提供商与一个 [agent harness](/zh-CN/plugins/sdk-agent-harness) 配合使用，而不是把守护进程协议细节放进核心中。
</Tip>

## 演练

<Steps>
  <Step title="软件包和清单">
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

    该清单声明了 `providerAuthEnvVars`，这样 OpenClaw 就能在不加载你的插件运行时的情况下检测凭证。若某个提供商变体应复用另一个提供商 id 的认证，请添加 `providerAuthAliases`。`modelSupport` 是可选项，它允许 OpenClaw 在运行时钩子存在之前，依据像 `acme-large` 这样的简写模型 id 自动加载你的提供商插件。如果你要在 ClawHub 上发布该提供商，那么 `package.json` 中的这些 `openclaw.compat` 和 `openclaw.build` 字段是必需的。

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

    这就是一个可工作的提供商。用户现在可以运行
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

    `input` 会在传输前重写最终系统提示词和文本消息内容。`output` 会在 OpenClaw 解析其自身控制标记或进行渠道投递之前，重写助手文本增量和最终文本。

    对于仅注册一个带 API 密钥认证的文本提供商、再加上一个由目录支持的单一运行时的内置提供商，优先使用更窄的 `defineSingleProviderPluginEntry(...)` 辅助函数：

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

    `buildProvider` 是 OpenClaw 能够解析真实提供商认证时所使用的实时目录路径。它可以执行提供商特定的发现逻辑。仅在需要展示可安全离线显示、且在认证配置完成前就能展示的条目时使用 `buildStaticProvider`；它不得依赖凭证，也不得发起网络请求。OpenClaw 的 `models list --all` 显示当前仅对内置提供商插件执行静态目录，并且是在空配置、空环境、无智能体路径和无工作区路径的条件下执行。

    如果你的认证流程还需要在新手引导期间修补 `models.providers.*`、别名以及智能体默认模型，请使用 `openclaw/plugin-sdk/provider-onboard` 中的预设辅助函数。最窄的辅助函数包括
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)` 和
    `createModelCatalogPresetAppliers(...)`。

    当某个提供商的原生端点在常规 `openai-completions` 传输上支持流式 usage 块时，优先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共享目录辅助函数，而不是硬编码提供商 id 检查。`supportsNativeStreamingUsageCompat(...)` 和
    `applyProviderNativeStreamingUsageCompat(...)` 会从端点能力映射中检测支持情况，因此原生 Moonshot/DashScope 风格的端点即使使用自定义提供商 id 的插件，也仍然可以启用该能力。

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

    如果解析需要网络调用，请使用 `prepareDynamicModel` 进行异步预热——在它完成后，`resolveDynamicModel` 会再次运行。

  </Step>

  <Step title="按需添加运行时钩子">
    大多数提供商只需要 `catalog` + `resolveDynamicModel`。随着你的提供商需求增加，再逐步添加钩子。

    共享辅助构建器现在已经覆盖最常见的重放/工具兼容性族，因此插件通常不需要手动逐个接线每个钩子：

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

    当前可用的重放族包括：

    | Family | 它会接入的内容 | 内置示例 |
    | --- | --- | --- |
    | `openai-compatible` | 面向与 OpenAI 兼容传输的共享 OpenAI 风格重放策略，包括工具调用 id 清洗、assistant-first 顺序修正，以及在传输需要时的通用 Gemini 轮次校验 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | 按 `modelId` 选择的 Claude 感知重放策略，因此基于 Anthropic 消息的传输仅在解析出的模型实际是 Claude id 时才会获得 Claude 特定的思维块清理 | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | 原生 Gemini 重放策略，外加启动重放清洗和带标签的 reasoning 输出模式 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | 用于通过与 OpenAI 兼容的代理传输运行 Gemini 模型时的 Gemini thought-signature 清洗；不会启用原生 Gemini 重放校验或启动重写 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 适用于在同一个插件中混合 Anthropic 消息面和与 OpenAI 兼容模型面的提供商的混合策略；可选的仅 Claude 思维块丢弃仍然仅作用于 Anthropic 一侧 | `minimax` |

    当前可用的流族包括：

    | Family | 它会接入的内容 | 内置示例 |
    | --- | --- | --- |
    | `google-thinking` | 共享流路径上的 Gemini thinking 负载规范化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共享代理流路径上的 Kilo reasoning 包装器，其中 `kilo/auto` 和不受支持的代理 reasoning id 会跳过注入的 thinking | `kilocode` |
    | `moonshot-thinking` | 根据配置和 `/think` 级别对 Moonshot 二进制原生 thinking 负载进行映射 | `moonshot` |
    | `minimax-fast-mode` | 共享流路径上的 MiniMax fast-mode 模型重写 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共享的原生 OpenAI/Codex Responses 包装器：归属标头、`/fast`/`serviceTier`、文本详细程度、原生 Codex web search、reasoning 兼容负载塑形，以及 Responses 上下文管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | 面向代理路由的 OpenRouter reasoning 包装器，集中处理不受支持模型和 `auto` 跳过逻辑 | `openrouter` |
    | `tool-stream-default-on` | 面向像 Z.AI 这样希望默认启用工具流式传输、除非显式禁用的提供商的默认开启 `tool_stream` 包装器 | `zai` |

    <Accordion title="为这些 family builder 提供支持的 SDK 接缝">
      每个 family builder 都由同一软件包导出的更底层公共辅助函数组合而成，当某个提供商需要偏离通用模式时，你可以改用这些辅助函数：

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`，以及原始重放构建器（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。还导出 Gemini 重放辅助函数（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）以及端点/模型辅助函数（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`，以及共享的 OpenAI/Codex 包装器（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）和共享的代理/提供商包装器（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、底层 Gemini schema 辅助函数（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`），以及 xAI 兼容辅助函数（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。内置的 xAI 插件结合使用 `normalizeResolvedModel` + `contributeResolvedModelCompat` 和这些辅助函数，以确保 xAI 规则由该提供商自行维护。

      有些流辅助函数会有意保留为提供商本地实现。`@openclaw/anthropic-provider` 将 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 以及更底层的 Anthropic 包装器构建器保留在它自己的公共 `api.ts` / `contract-api.ts` 接缝中，因为它们编码了 Claude OAuth beta 处理和 `context1m` 门控。类似地，xAI 插件也将原生 xAI Responses 塑形保留在它自己的 `wrapStreamFn` 中（`/fast` 别名、默认 `tool_stream`、不受支持的严格工具清理、xAI 特定 reasoning 负载移除）。

      相同的软件包根模式也支撑着 `@openclaw/openai-provider`（提供商构建器、默认模型辅助函数、实时提供商构建器）和 `@openclaw/openrouter-provider`（提供商构建器，以及新手引导/配置辅助函数）。
    </Accordion>

    <Tabs>
      <Tab title="Token 交换">
        对于需要在每次推理调用前进行 token 交换的提供商：

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
        // wrapStreamFn 返回一个从 ctx.streamFn 派生的 StreamFn
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
        对于需要在通用 HTTP 或 WebSocket 传输上使用原生请求/会话标头或元数据的提供商：

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
        对于提供用量/计费数据的提供商：

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
      OpenClaw 会按以下顺序调用钩子。大多数提供商只会用到 2 到 3 个：

      | # | Hook | 何时使用 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目录或基础 `baseUrl` 默认值 |
      | 2 | `applyConfigDefaults` | 在配置具体化期间应用由提供商维护的全局默认值 |
      | 3 | `normalizeModelId` | 在查找前清理旧版/预览模型 id 别名 |
      | 4 | `normalizeTransport` | 在通用模型组装前清理提供商 family 的 `api` / `baseUrl` |
      | 5 | `normalizeConfig` | 规范化 `models.providers.<id>` 配置 |
      | 6 | `applyNativeStreamingUsageCompat` | 面向配置提供商的原生流式 usage 兼容重写 |
      | 7 | `resolveConfigApiKey` | 由提供商维护的环境标记认证解析 |
      | 8 | `resolveSyntheticAuth` | 本地/自托管或基于配置的合成认证 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 将合成存储配置文件占位符降级到环境/配置认证之后 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 id |
      | 11 | `prepareDynamicModel` | 在解析前异步拉取元数据 |
      | 12 | `normalizeResolvedModel` | 在 runner 之前重写传输 |
      | 13 | `contributeResolvedModelCompat` | 为通过另一种兼容传输暴露的厂商模型提供兼容标志 |
      | 14 | `capabilities` | 旧版静态能力包；仅为兼容性保留 |
      | 15 | `normalizeToolSchemas` | 在注册前清理由提供商维护的工具 schema |
      | 16 | `inspectToolSchemas` | 由提供商维护的工具 schema 诊断 |
      | 17 | `resolveReasoningOutputMode` | 带标签与原生 reasoning 输出契约 |
      | 18 | `prepareExtraParams` | 默认请求参数 |
      | 19 | `createStreamFn` | 完全自定义的 StreamFn 传输 |
      | 20 | `wrapStreamFn` | 常规流路径上的自定义标头/请求体包装器 |
      | 21 | `resolveTransportTurnState` | 原生逐轮标头/元数据 |
      | 22 | `resolveWebSocketSessionPolicy` | 原生 WS 会话标头/冷却时间 |
      | 23 | `formatApiKey` | 自定义运行时 token 形态 |
      | 24 | `refreshOAuth` | 自定义 OAuth 刷新 |
      | 25 | `buildAuthDoctorHint` | 认证修复指引 |
      | 26 | `matchesContextOverflowError` | 由提供商维护的上下文溢出检测 |
      | 27 | `classifyFailoverReason` | 由提供商维护的限流/过载分类 |
      | 28 | `isCacheTtlEligible` | 提示词缓存 TTL 门控 |
      | 29 | `buildMissingAuthMessage` | 自定义缺失认证提示 |
      | 30 | `suppressBuiltInModel` | 隐藏过时的上游条目 |
      | 31 | `augmentModelCatalog` | 合成的前向兼容条目 |
      | 32 | `resolveThinkingProfile` | 模型特定的 `/think` 选项集 |
      | 33 | `isBinaryThinking` | 二进制 thinking 开/关兼容性 |
      | 34 | `supportsXHighThinking` | `xhigh` reasoning 支持兼容性 |
      | 35 | `resolveDefaultThinkingLevel` | 默认 `/think` 策略兼容性 |
      | 36 | `isModernModelRef` | 实时/冒烟模型匹配 |
      | 37 | `prepareRuntimeAuth` | 推理前的 token 交换 |
      | 38 | `resolveUsageAuth` | 自定义用量凭证解析 |
      | 39 | `fetchUsageSnapshot` | 自定义用量端点 |
      | 40 | `createEmbeddingProvider` | 面向 memory/search 的提供商自有 embedding 适配器 |
      | 41 | `buildReplayPolicy` | 自定义转录重放/压缩策略 |
      | 42 | `sanitizeReplayHistory` | 通用清理后的提供商特定重放重写 |
      | 43 | `validateReplayTurns` | 在嵌入式 runner 之前严格校验重放轮次 |
      | 44 | `onModelSelected` | 选择模型后的回调（例如遥测） |

      运行时回退说明：

      - `normalizeConfig` 会先检查匹配到的提供商，然后再检查其他具备钩子能力的提供商插件，直到某一个实际修改了配置。如果没有任何提供商钩子重写受支持的 Google family 配置项，内置的 Google 配置规范化器仍会生效。
      - `resolveConfigApiKey` 在提供商暴露该钩子时会使用该钩子。内置的 `amazon-bedrock` 路径在这里也有一个内建的 AWS 环境标记解析器，尽管 Bedrock 运行时认证本身仍使用 AWS SDK 默认链。
      - `resolveSystemPromptContribution` 允许提供商为某个模型 family 注入具备缓存感知的系统提示词指导。当某个行为属于单一提供商/模型 family，并且需要保留稳定/动态缓存拆分时，优先使用它，而不是 `before_prompt_build`。

      有关详细说明和真实示例，请参见 [内部机制：提供商运行时钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    提供商插件除了文本推理之外，还可以注册语音、实时转录、实时语音、媒体理解、图像生成、视频生成、web 获取和 web 搜索。OpenClaw 将这类插件归类为
    **混合能力** 插件——这是公司插件（每个厂商一个插件）的推荐模式。请参见
    [内部机制：能力归属](/zh-CN/plugins/architecture#capability-ownership-model)。

    在 `register(api)` 内部、你现有的
    `api.registerProvider(...)` 调用旁边注册每项能力。只选择你需要的标签页：

    <Tabs>
      <Tab title="语音（TTS）">
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

        对于提供商 HTTP 失败，请使用 `assertOkOrThrowProviderError(...)`，这样插件就能共享有上限的错误体读取、JSON 错误解析以及 request-id 后缀处理。
      </Tab>
      <Tab title="实时转录">
        优先使用 `createRealtimeTranscriptionWebSocketSession(...)`——这个共享辅助函数会处理代理捕获、重连退避、关闭时冲刷、就绪握手、音频排队以及关闭事件诊断。你的插件只需要映射上游事件。

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

        通过 POST multipart 音频的批量 STT 提供商应使用
        `openclaw/plugin-sdk/provider-http` 中的
        `buildAudioTranscriptionFormData(...)`。该辅助函数会规范化上传文件名，包括那些为了兼容转录 API 而需要使用 M4A 风格文件名的 AAC 上传。
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
        视频能力使用一种 **模式感知** 结构：`generate`、
        `imageToVideo` 和 `videoToVideo`。像
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` 这样的扁平聚合字段不足以干净地声明变换模式支持或禁用模式。
        音乐生成也遵循相同模式，使用显式的 `generate` /
        `edit` 块。

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
      <Tab title="web 获取和搜索">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "通过 Acme 的渲染后端获取页面。",
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
            description: "通过 Acme Fetch 获取页面。",
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
    // 从 index.ts 或专用文件导出你的 provider 配置对象
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

这里不要使用旧版的仅 Skills 发布别名；插件包应使用
`clawhub package publish`。

## 文件结构

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 元数据
├── openclaw.plugin.json      # 带提供商认证元数据的清单
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 测试
    └── usage.ts              # 用量端点（可选）
```

## 目录顺序参考

`catalog.order` 控制你的目录相对于内置提供商的合并时机：

| Order     | 时机          | 使用场景                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一轮        | 纯 API 密钥提供商                               |
| `profile` | 在 simple 之后 | 受认证配置文件控制的提供商                      |
| `paired`  | 在 profile 之后 | 合成多个相关条目                                |
| `late`    | 最后一轮      | 覆盖现有提供商（冲突时胜出）                    |

## 后续步骤

- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) —— 如果你的插件还提供一个渠道
- [SDK 运行时](/zh-CN/plugins/sdk-runtime) —— `api.runtime` 辅助函数（TTS、搜索、subagent）
- [SDK 概览](/zh-CN/plugins/sdk-overview) —— 完整的子路径导入参考
- [插件内部机制](/zh-CN/plugins/architecture-internals#provider-runtime-hooks) —— 钩子细节和内置示例

## 相关内容

- [插件 SDK 设置](/zh-CN/plugins/sdk-setup)
- [构建插件](/zh-CN/plugins/building-plugins)
- [构建渠道插件](/zh-CN/plugins/sdk-channel-plugins)
