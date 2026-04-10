---
read_when:
    - 你正在构建一个新的模型提供商插件
    - 你想将兼容 OpenAI 的代理或自定义 LLM 添加到 OpenClaw 中
    - 你需要理解提供商凭证、目录和运行时钩子
sidebarTitle: Provider Plugins
summary: 为 OpenClaw 构建模型提供商插件的分步指南
title: 构建提供商插件
x-i18n:
    generated_at: "2026-04-10T20:23:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: b81b80627fd594e2dc889c95359df665ebbbb85c74c231a226219dcb556f193b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# 构建提供商插件

本指南将带你构建一个为 OpenClaw 添加模型提供商（LLM）的提供商插件。完成后，你将拥有一个包含模型目录、API 密钥凭证以及动态模型解析的提供商。

<Info>
  如果你之前没有构建过任何 OpenClaw 插件，请先阅读 [入门指南](/zh-CN/plugins/building-plugins)，了解基础包结构和清单设置。
</Info>

<Tip>
  提供商插件会将模型添加到 OpenClaw 的常规推理循环中。如果模型必须通过一个拥有线程、压缩或工具事件的原生智能体守护进程运行，请将该提供商与 [agent harness](/zh-CN/plugins/sdk-agent-harness) 搭配使用，而不是把守护进程协议细节放进核心中。
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
      "description": "Acme AI 模型提供商",
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
          "choiceLabel": "Acme AI API 密钥",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API 密钥"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    清单声明了 `providerAuthEnvVars`，这样 OpenClaw 无需加载你的插件运行时就能检测凭证。当某个提供商变体应复用另一个提供商 id 的凭证时，请添加 `providerAuthAliases`。`modelSupport` 是可选的，它允许 OpenClaw 在运行时钩子存在之前，先根据类似 `acme-large` 这样的简写模型 id 自动加载你的提供商插件。如果你要在 ClawHub 上发布该提供商，那么 `package.json` 中的这些 `openclaw.compat` 和 `openclaw.build` 字段是必需的。

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

    这样就得到一个可工作的提供商了。用户现在可以运行 `openclaw onboard --acme-ai-api-key <key>` 并选择 `acme-ai/acme-large` 作为他们的模型。

    对于只注册一个文本提供商、使用 API 密钥凭证，并且只有一个基于目录的运行时的内置提供商，优先使用更窄的 `defineSingleProviderPluginEntry(...)` 辅助函数：

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

    如果你的凭证流程还需要在新手引导期间修补 `models.providers.*`、别名以及智能体默认模型，请使用 `openclaw/plugin-sdk/provider-onboard` 中的预设辅助函数。最窄的辅助函数包括 `createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)` 和 `createModelCatalogPresetAppliers(...)`。

    当某个提供商的原生端点在常规 `openai-completions` 传输协议上支持分块流式传输使用量块时，优先使用 `openclaw/plugin-sdk/provider-catalog-shared` 中的共享目录辅助函数，而不是硬编码提供商 id 检查。`supportsNativeStreamingUsageCompat(...)` 和 `applyProviderNativeStreamingUsageCompat(...)` 会根据端点能力映射检测支持情况，因此即使插件使用的是自定义提供商 id，原生 Moonshot/DashScope 风格端点仍然可以选择启用。

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

    如果解析需要网络调用，请使用 `prepareDynamicModel` 进行异步预热 —— 完成后会再次运行 `resolveDynamicModel`。

  </Step>

  <Step title="按需添加运行时钩子">
    大多数提供商只需要 `catalog` + `resolveDynamicModel`。随着你的提供商提出更高要求，再逐步添加钩子。

    共享辅助构建器现在已覆盖最常见的重放/工具兼容性系列，因此插件通常不需要手动逐个连接每个钩子：

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

    | 系列 | 它会接入的内容 |
    | --- | --- |
    | `openai-compatible` | OpenAI 兼容传输协议的共享 OpenAI 风格重放策略，包括工具调用 id 清理、assistant-first 顺序修复，以及传输协议需要时的通用 Gemini 轮次校验 |
    | `anthropic-by-model` | 按 `modelId` 选择的 Claude 感知重放策略，因此 Anthropic 消息传输协议只会在解析出的模型确实是 Claude id 时，才获得 Claude 专用的思维块清理 |
    | `google-gemini` | 原生 Gemini 重放策略，加上引导重放清理和带标签的推理输出模式 |
    | `passthrough-gemini` | 用于通过 OpenAI 兼容代理传输协议运行的 Gemini 模型的 Gemini thought-signature 清理；不会启用原生 Gemini 重放校验或引导重写 |
    | `hybrid-anthropic-openai` | 适用于在一个插件中混合 Anthropic 消息和 OpenAI 兼容模型面的提供商的混合策略；可选的仅 Claude 思维块丢弃仍然只作用于 Anthropic 一侧 |

    真实的内置示例：

    - `google` 和 `google-gemini-cli`：`google-gemini`
    - `openrouter`、`kilocode`、`opencode` 和 `opencode-go`：`passthrough-gemini`
    - `amazon-bedrock` 和 `anthropic-vertex`：`anthropic-by-model`
    - `minimax`：`hybrid-anthropic-openai`
    - `moonshot`、`ollama`、`xai` 和 `zai`：`openai-compatible`

    当前可用的流式系列：

    | 系列 | 它会接入的内容 |
    | --- | --- |
    | `google-thinking` | 共享流路径上的 Gemini thinking 负载规范化 |
    | `kilocode-thinking` | 共享代理流路径上的 Kilo 推理包装器，其中 `kilo/auto` 和不受支持的代理推理 id 会跳过注入的 thinking |
    | `moonshot-thinking` | 根据配置和 `/think` 级别，将 Moonshot 二进制原生 thinking 负载进行映射 |
    | `minimax-fast-mode` | 共享流路径上的 MiniMax fast-mode 模型重写 |
    | `openai-responses-defaults` | 共享原生 OpenAI/Codex Responses 包装器：归因头、`/fast`/`serviceTier`、文本冗长度、原生 Codex web search、推理兼容负载整形，以及 Responses 上下文管理 |
    | `openrouter-thinking` | 用于代理路由的 OpenRouter 推理包装器，集中处理不受支持模型和 `auto` 跳过逻辑 |
    | `tool-stream-default-on` | 为像 Z.AI 这样希望默认启用工具流式传输的提供商提供默认开启的 `tool_stream` 包装器，除非显式禁用 |

    真实的内置示例：

    - `google` 和 `google-gemini-cli`：`google-thinking`
    - `kilocode`：`kilocode-thinking`
    - `moonshot`：`moonshot-thinking`
    - `minimax` 和 `minimax-portal`：`minimax-fast-mode`
    - `openai` 和 `openai-codex`：`openai-responses-defaults`
    - `openrouter`：`openrouter-thinking`
    - `zai`：`tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` 也导出了 replay-family 枚举，以及这些系列所基于的共享辅助函数。常见的公共导出包括：

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - 共享重放构建器，例如 `buildOpenAICompatibleReplayPolicy(...)`、`buildAnthropicReplayPolicyForModel(...)`、`buildGoogleGeminiReplayPolicy(...)` 和 `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini 重放辅助函数，例如 `sanitizeGoogleGeminiReplayHistory(...)` 和 `resolveTaggedReasoningOutputMode()`
    - 端点/模型辅助函数，例如 `resolveProviderEndpoint(...)`、`normalizeProviderId(...)`、`normalizeGooglePreviewModelId(...)` 和 `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` 同时公开了系列构建器以及这些系列复用的公共包装辅助函数。常见的公共导出包括：

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - 共享的 OpenAI/Codex 包装器，例如 `createOpenAIAttributionHeadersWrapper(...)`、`createOpenAIFastModeWrapper(...)`、`createOpenAIServiceTierWrapper(...)`、`createOpenAIResponsesContextManagementWrapper(...)` 和 `createCodexNativeWebSearchWrapper(...)`
    - 共享代理/提供商包装器，例如 `createOpenRouterWrapper(...)`、`createToolStreamWrapper(...)` 和 `createMinimaxFastModeWrapper(...)`

    有些流式辅助函数会有意保持为提供商本地实现。当前的内置示例：`@openclaw/anthropic-provider` 从其公共 `api.ts` / `contract-api.ts` 接缝导出 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`，以及更底层的 Anthropic 包装器构建器。这些辅助函数仍然保持为 Anthropic 专用，因为它们还编码了 Claude OAuth beta 处理和 `context1m` 门控。

    其他内置提供商也会在行为无法在系列之间清晰共享时，将传输协议专用包装器保留为本地实现。当前示例：内置的 xAI 插件将原生 xAI Responses 整形保留在它自己的 `wrapStreamFn` 中，其中包括 `/fast` 别名重写、默认 `tool_stream`、不受支持的 strict-tool 清理，以及 xAI 专用的 reasoning-payload 移除。

    `openclaw/plugin-sdk/provider-tools` 当前公开了一个共享工具模式系列，以及共享模式/兼容性辅助函数：

    - `ProviderToolCompatFamily` 记录了当前共享系列清单。
    - `buildProviderToolCompatFamilyHooks("gemini")` 会为需要 Gemini 安全工具模式的提供商接入 Gemini 模式清理和诊断。
    - `normalizeGeminiToolSchemas(...)` 和 `inspectGeminiToolSchemas(...)` 是底层的公共 Gemini 模式辅助函数。
    - `resolveXaiModelCompatPatch()` 返回内置的 xAI 兼容性补丁：`toolSchemaProfile: "xai"`、不受支持的模式关键字、原生 `web_search` 支持，以及 HTML 实体工具调用参数解码。
    - `applyXaiModelCompat(model)` 会在解析出的模型到达运行器之前，将同样的 xAI 兼容性补丁应用到该模型上。

    真实的内置示例：xAI 插件使用 `normalizeResolvedModel` 加上 `contributeResolvedModelCompat`，以便让该兼容性元数据由提供商自己维护，而不是在核心中硬编码 xAI 规则。

    同样的包根模式也支撑着其他内置提供商：

    - `@openclaw/openai-provider`：`api.ts` 导出提供商构建器、默认模型辅助函数和 realtime 提供商构建器
    - `@openclaw/openrouter-provider`：`api.ts` 导出提供商构建器以及新手引导/配置辅助函数

    <Tabs>
      <Tab title="令牌交换">
        对于需要在每次推理调用前进行令牌交换的提供商：

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
      <Tab title="自定义请求头">
        对于需要自定义请求头或请求体修改的提供商：

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
      <Tab title="原生传输协议标识">
        对于需要在通用 HTTP 或 WebSocket 传输协议上附加原生请求/会话请求头或元数据的提供商：

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
      OpenClaw 会按以下顺序调用这些钩子。大多数提供商只会用到 2-3 个：

      | # | 钩子 | 何时使用 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目录或基础 URL 默认值 |
      | 2 | `applyConfigDefaults` | 配置实体化期间由提供商拥有的全局默认值 |
      | 3 | `normalizeModelId` | 查找前清理旧版/预览版模型 id 别名 |
      | 4 | `normalizeTransport` | 通用模型组装前进行提供商系列的 `api` / `baseUrl` 清理 |
      | 5 | `normalizeConfig` | 规范化 `models.providers.<id>` 配置 |
      | 6 | `applyNativeStreamingUsageCompat` | 对配置提供商应用原生分块流式传输用量兼容性重写 |
      | 7 | `resolveConfigApiKey` | 由提供商拥有的环境变量标记凭证解析 |
      | 8 | `resolveSyntheticAuth` | 本地/自托管或基于配置的合成凭证 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 将合成的已存储配置文件占位符优先级降到环境变量/配置凭证之后 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 id |
      | 11 | `prepareDynamicModel` | 解析前异步获取元数据 |
      | 12 | `normalizeResolvedModel` | 运行器之前的传输协议重写 |

    运行时回退说明：

    - `normalizeConfig` 会先检查匹配的提供商，然后再检查其他具备钩子能力的提供商插件，直到其中一个真正更改了配置。
      如果没有任何提供商钩子重写受支持的 Google 系列配置项，内置的 Google 配置规范化器仍会生效。
    - `resolveConfigApiKey` 会在提供商暴露该钩子时使用提供商钩子。内置的 `amazon-bedrock` 路径在这里也有一个内建的 AWS 环境变量标记解析器，即使 Bedrock 运行时凭证本身仍然使用 AWS SDK 默认链。
      | 13 | `contributeResolvedModelCompat` | 为运行在另一种兼容传输协议后的厂商模型提供兼容性标志 |
      | 14 | `capabilities` | 旧版静态能力包；仅为兼容性保留 |
      | 15 | `normalizeToolSchemas` | 注册前由提供商拥有的工具模式清理 |
      | 16 | `inspectToolSchemas` | 由提供商拥有的工具模式诊断 |
      | 17 | `resolveReasoningOutputMode` | 带标签与原生推理输出契约 |
      | 18 | `prepareExtraParams` | 默认请求参数 |
      | 19 | `createStreamFn` | 完全自定义的 StreamFn 传输协议 |
      | 20 | `wrapStreamFn` | 常规流路径上的自定义请求头/请求体包装器 |
      | 21 | `resolveTransportTurnState` | 原生逐轮请求头/元数据 |
      | 22 | `resolveWebSocketSessionPolicy` | 原生 WS 会话请求头/冷却时间 |
      | 23 | `formatApiKey` | 自定义运行时令牌格式 |
      | 24 | `refreshOAuth` | 自定义 OAuth 刷新 |
      | 25 | `buildAuthDoctorHint` | 凭证修复指导 |
      | 26 | `matchesContextOverflowError` | 由提供商拥有的上下文溢出检测 |
      | 27 | `classifyFailoverReason` | 由提供商拥有的限流/过载分类 |
      | 28 | `isCacheTtlEligible` | 提示词缓存 TTL 门控 |
      | 29 | `buildMissingAuthMessage` | 自定义缺失凭证提示 |
      | 30 | `suppressBuiltInModel` | 隐藏过时的上游行 |
      | 31 | `augmentModelCatalog` | 合成的前向兼容行 |
      | 32 | `isBinaryThinking` | 二进制 thinking 开/关 |
      | 33 | `supportsXHighThinking` | `xhigh` 推理支持 |
      | 34 | `resolveDefaultThinkingLevel` | 默认 `/think` 策略 |
      | 35 | `isModernModelRef` | live/smoke 模型匹配 |
      | 36 | `prepareRuntimeAuth` | 推理前进行令牌交换 |
      | 37 | `resolveUsageAuth` | 自定义用量凭证解析 |
      | 38 | `fetchUsageSnapshot` | 自定义用量端点 |
      | 39 | `createEmbeddingProvider` | 用于 memory/search 的由提供商拥有的嵌入适配器 |
      | 40 | `buildReplayPolicy` | 自定义转录重放/压缩策略 |
      | 41 | `sanitizeReplayHistory` | 通用清理后的提供商专用重放重写 |
      | 42 | `validateReplayTurns` | 嵌入式运行器之前的严格重放轮次校验 |
      | 43 | `onModelSelected` | 选择模型后的回调（例如遥测） |

      提示词调优说明：

      - `resolveSystemPromptContribution` 允许提供商为某个模型系列注入具备缓存感知能力的 system prompt 指导。对于属于某一个提供商/模型系列且应保留稳定/动态缓存拆分的行为，优先使用它，而不是 `before_prompt_build`。

      如需详细说明和真实示例，请参阅 [内部机制：提供商运行时钩子](/zh-CN/plugins/architecture#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    <a id="step-5-add-extra-capabilities"></a>
    提供商插件除了文本推理之外，还可以注册语音、实时转录、实时语音、媒体理解、图像生成、视频生成、网页抓取和网页搜索：

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
    }
    ```

    OpenClaw 会将其归类为 **hybrid-capability** 插件。这是公司插件（每个厂商一个插件）的推荐模式。请参阅 [内部机制：能力归属](/zh-CN/plugins/architecture#capability-ownership-model)。

    对于视频生成，优先使用上面展示的具备模式感知的能力结构：`generate`、`imageToVideo` 和 `videoToVideo`。像 `maxInputImages`、`maxInputVideos` 和 `maxDurationSeconds` 这样的扁平聚合字段，不足以清晰表达转换模式支持或已禁用的模式。

    音乐生成提供商也应遵循同样的模式：`generate` 用于仅基于提示词的生成，`edit` 用于基于参考图像的生成。像 `maxInputImages`、`supportsLyrics` 和 `supportsFormat` 这样的扁平聚合字段，不足以表达编辑支持；显式的 `generate` / `edit` 块才是预期契约。

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

提供商插件的发布方式与其他外部代码插件相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

这里不要使用旧版仅适用于 skill 的发布别名；插件包应使用 `clawhub package publish`。

## 文件结构

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 元数据
├── openclaw.plugin.json      # 包含提供商凭证元数据的清单
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 测试
    └── usage.ts              # 用量端点（可选）
```

## 目录顺序参考

`catalog.order` 控制你的目录相对于内置提供商的合并时机：

| 顺序 | 时机 | 使用场景 |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 第一轮 | 纯 API 密钥提供商 |
| `profile` | 在 simple 之后 | 受凭证配置文件控制的提供商 |
| `paired`  | 在 profile 之后 | 合成多个相关条目 |
| `late`    | 最后一轮 | 覆盖现有提供商（冲突时胜出） |

## 后续步骤

- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 如果你的插件也提供一个渠道
- [插件 SDK 运行时](/zh-CN/plugins/sdk-runtime) — `api.runtime` 辅助函数（TTS、搜索、子智能体）
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview) — 完整的子路径导入参考
- [插件内部机制](/zh-CN/plugins/architecture#provider-runtime-hooks) — 钩子细节和内置示例
